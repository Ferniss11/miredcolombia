// src/lib/chat/infrastructure/ai/genkit-agent.adapter.ts
import type { AgentAdapter, AgentCompletionOutput } from './agent.adapter';
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

  private async getAgentConfigForUser(chatHistory: Omit<ChatMessage, 'id' | 'timestamp'>[]): Promise<AgentConfig> {
    const lastUserMessage = chatHistory.findLast(m => m.role === 'user');
    const userId = lastUserMessage?.authorId;
    
    if (userId && adminAuth) {
        try {
            const userRecord = await adminAuth.getUser(userId);
            const plan = userRecord.customClaims?.valeria_plan as 'valeria_premium' | undefined;

            if (plan === 'valeria_premium') {
                return this.userRepository.getAgentConfig('valeria_premium');
            }
        } catch (error) {
            console.warn(`[GenkitAgentAdapter] Could not get auth user for ID ${userId}, falling back to global agent.`, error);
        }
    }
    
    return this.userRepository.getAgentConfig('global');
  }


  async getCompletion(input: {
    chatHistory: Omit<ChatMessage, 'id' | 'timestamp'>[];
    currentMessage: string;
    businessId?: string;
    sessionId?: string;
    agentId?: 'global' | 'valeria_premium' | 'business';
  }): Promise<AgentCompletionOutput> {
    
    const chatHistoryForAI = input.chatHistory.map(m => ({
      role: m.role === 'admin' ? 'model' : m.role,
      text: m.role === 'admin' ? `[Mensaje del Administrador: ${m.text}]` : m.text,
    }));

    let agentConfig: AgentConfig;

    if (input.agentId) { // Lab Mode
        if (input.agentId === 'business' && input.businessId) {
             const user = await this.userRepository.findUserByBusinessId(input.businessId);
             agentConfig = user?.businessProfile?.agentConfig || await this.userRepository.getAgentConfig('global');
        } else {
             agentConfig = await this.userRepository.getAgentConfig(input.agentId);
        }
    } else if (input.businessId) { // Business Chat Mode
        const businessDetails = await this.getBusinessDetailsUseCase.execute(input.businessId);
        if (!businessDetails || !businessDetails.ownerUid) {
            throw new Error(`Business with ID ${input.businessId} not found or has no owner.`);
        }
        const owner = await this.userRepository.findByUid(businessDetails.ownerUid);
        agentConfig = owner?.businessProfile?.agentConfig || await this.userRepository.getAgentConfig('global');
        
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
        return { response: aiResponse.response, usage, cost, agentConfig };

    } else { // Global Chat Mode
        agentConfig = await this.getAgentConfigForUser(input.chatHistory);
    }
    
    // This part is for Global, Premium, and Lab agents that use the 'migrationChat' flow
    const aiResponse = await migrationChat({
        model: agentConfig.model,
        systemPrompt: agentConfig.systemPrompt || DEFAULT_GLOBAL_PROMPT,
        chatHistory: chatHistoryForAI,
        currentMessage: input.currentMessage,
        sessionId: input.sessionId, // Pass sessionId to the flow
    });
    
    const usage = aiResponse.usage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    const cost = calculateCost(agentConfig.model, usage.inputTokens, usage.outputTokens);
    
    return { response: aiResponse.response, usage, cost, agentConfig };
  }
}
