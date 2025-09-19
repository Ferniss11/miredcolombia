
// src/lib/chat/infrastructure/ai/agent.adapter.ts
import type { AgentAdapter } from './agent.adapter';
import type { ChatMessage } from '../../domain/chat-message.entity';
import type { TokenUsage, AgentConfig } from '@/lib/chat-types';
import { adminAuth } from '@/lib/firebase/admin-config';
import { calculateCost } from '@/lib/ai-costs';

// Import the specific Genkit flows
import { migrationChat } from '@/ai/migrationAgent/flows/migration-chat-flow';
import { businessChat } from '@/ai/businessAgent/flows/business-chat-flow';
import { FirestoreUserRepository } from '@/lib/user/infrastructure/persistence/firestore-user.repository';
import { GetBusinessDetailsUseCase } from '@/lib/directory/application/get-business-details.use-case';
import { FirestoreDirectoryRepository } from '@/lib/directory/infrastructure/persistence/firestore-directory.repository';
import { GooglePlacesAdapter } from '@/lib/directory/infrastructure/search/google-places.adapter';
import { FirestoreCacheAdapter } from '@/lib/directory/infrastructure/cache/firestore-cache.adapter';


const DEFAULT_GLOBAL_PROMPT = 'Eres un asistente de IA para Mi Red Colombia. Ayuda a los usuarios con sus preguntas sobre inmigración y servicios.';

/**
 * An adapter that uses Genkit to provide AI agent completions.
 * It dynamically selects the appropriate agent (global vs. business) based on context.
 */
export class GenkitAgentAdapter implements AgentAdapter {
  private userRepository: FirestoreUserRepository;
  private getBusinessDetailsUseCase: GetBusinessDetailsUseCase;

  constructor() {
    this.userRepository = new FirestoreUserRepository();
    const directoryRepository = new FirestoreDirectoryRepository();
    const searchAdapter = new GooglePlacesAdapter();
    const cacheAdapter = new FirestoreCacheAdapter();
    this.getBusinessDetailsUseCase = new GetBusinessDetailsUseCase(directoryRepository, searchAdapter, cacheAdapter);
  }

  private async getAgentConfigForUser(chatHistory: ChatMessage[]): Promise<AgentConfig> {
    const lastUserMessage = chatHistory.findLast(m => m.role === 'user');
    const userId = lastUserMessage?.authorId; // Assuming authorId is set on user messages
    
    if (userId && adminAuth) {
        try {
            const userRecord = await adminAuth.getUser(userId);
            const plan = userRecord.customClaims?.valeria_plan as 'valeria_premium' | undefined;

            // If the user has a premium plan, load that specific agent config
            if (plan === 'valeria_premium') {
                return this.userRepository.getAgentConfig('valeria_premium');
            }
        } catch (error) {
            console.warn(`[GenkitAgentAdapter] Could not get auth user for ID ${userId}, falling back to global agent.`, error);
        }
    }
    
    // Default to global agent for guests or free users
    return this.userRepository.getAgentConfig('global');
  }


  async getCompletion(input: {
    chatHistory: ChatMessage[];
    currentMessage: string;
    businessId?: string;
    sessionId?: string; // Now we receive the session ID
    agentId?: 'global' | 'valeria_premium' | 'business';
  }): Promise<{ response: string; usage: TokenUsage; cost: number; }> {
    
    const chatHistoryForAI = input.chatHistory.map(m => ({
      role: m.role === 'admin' ? 'model' : m.role, // Treat admin messages as model messages from AI's perspective
      text: m.role === 'admin' ? `[Mensaje del Administrador: ${m.text}]` : m.text,
    }));
    
    // --- Logic for explicit agent selection (Agent Lab) ---
    if (input.agentId) {
        let agentConfig: AgentConfig;
        if (input.agentId === 'business' && input.businessId) {
             agentConfig = await this.userRepository.getAgentConfig(`business_${input.businessId}`);
        } else {
             agentConfig = await this.userRepository.getAgentConfig(input.agentId);
        }

        const aiResponse = await migrationChat({
            model: agentConfig.model,
            systemPrompt: agentConfig.systemPrompt || DEFAULT_GLOBAL_PROMPT,
            chatHistory: chatHistoryForAI,
            currentMessage: input.currentMessage,
            sessionId: input.sessionId, // Pass sessionId to the flow
        });

        const usage = aiResponse.usage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
        const cost = calculateCost(agentConfig.model, usage.inputTokens, usage.outputTokens);
        return { response: aiResponse.response, usage, cost };
    }

    // --- Standard Flow (Not from Agent Lab) ---
    
    if (input.businessId) {
      const businessDetails = await this.getBusinessDetailsUseCase.execute(input.businessId);
      if (!businessDetails || !businessDetails.ownerUid) {
        throw new Error(`Business with ID ${input.businessId} not found or has no owner.`);
      }
      
      const agentConfig = await this.userRepository.getAgentConfig(`business_${input.businessId}`);
      const businessContext = `Nombre: ${businessDetails.displayName}\nCategoría: ${businessDetails.category}\nDirección: ${businessDetails.formattedAddress}\nTeléfono: ${businessDetails.internationalPhoneNumber}\nDescripción: ${businessDetails.editorialSummary || ''}`;

      const aiResponse = await businessChat({
        ownerUid: businessDetails.ownerUid,
        chatHistory: chatHistoryForAI,
        currentMessage: input.currentMessage,
        businessContext,
        agentConfig,
      });
      
      const usage = aiResponse.usage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
      const cost = calculateCost(agentConfig.model, usage.inputTokens, usage.outputTokens);

      return { response: aiResponse.response, usage, cost };

    } else {
      // --- Global & Subscriber Agent Logic ---
      const agentConfig = await this.getAgentConfigForUser(input.chatHistory);
      
      const aiResponse = await migrationChat({
        model: agentConfig.model,
        systemPrompt: agentConfig.systemPrompt || DEFAULT_GLOBAL_PROMPT,
        chatHistory: chatHistoryForAI,
        currentMessage: input.currentMessage,
        sessionId: input.sessionId, // Pass sessionId to the flow
      });
      
      const usage = aiResponse.usage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
      const cost = calculateCost(agentConfig.model, usage.inputTokens, usage.outputTokens);
      
      return { response: aiResponse.response, usage, cost };
    }
  }
}
