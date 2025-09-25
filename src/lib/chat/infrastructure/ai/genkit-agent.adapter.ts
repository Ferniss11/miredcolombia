
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


const BASE_TOOL_PROMPT = `### INSTRUCCIONES DE HERRAMIENTAS
- **OBLIGATORIO:** Para cualquier pregunta sobre trámites de migración, requisitos, vivienda, trabajo o cualquier tema que requiera información específica y detallada, DEBES usar la herramienta \`knowledgeBaseSearch\` como primer paso. Es tu fuente de verdad principal.
- **PROHIBIDO:** No respondas a preguntas complejas sobre trámites usando únicamente tu conocimiento general. Si la herramienta no devuelve información, indica amablemente que no tienes datos sobre ese tema específico.
- **EXCEPCIÓN:** Si el usuario simplemente saluda ("Hola", "¿cómo estás?") o la conversación es casual, responde de forma natural sin usar la herramienta.
- **DOCUMENTOS EN SESIÓN:** Si el usuario menciona que ha subido un documento o te pide que revises uno, DEBES usar la herramienta \`knowledgeBaseSearch\` para encontrar la información de ese documento específico en la sesión actual.`;


/**
 * An adapter that uses Genkit to provide AI agent completions.
 * It dynamically selects the appropriate agent (global vs. business) and combines system prompts.
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

    // --- Agent Selection Logic ---
    
    // Priority 1: Lab Mode (explicit agentId is provided)
    if (input.agentId) { 
        if (input.agentId === 'business' && input.businessId) {
             const user = await this.userRepository.findUserByBusinessId(input.businessId);
             agentConfig = user?.businessProfile?.agentConfig || await this.userRepository.getAgentConfig('global');
        } else {
             agentConfig = await this.userRepository.getAgentConfig(input.agentId);
        }
    
    // Priority 2: Business Chat Mode (a businessId is provided)
    } else if (input.businessId) { 
        const businessDetails = await this.getBusinessDetailsUseCase.execute(input.businessId);
        if (!businessDetails || !businessDetails.ownerUid) {
            throw new Error(`Business with ID ${input.businessId} not found or has no owner.`);
        }
        const owner = await this.userRepository.findByUid(businessDetails.ownerUid);
        agentConfig = owner?.businessProfile?.agentConfig || await this.userRepository.getAgentConfig('global');
        
        const businessContext = `Nombre: ${businessDetails.displayName}\nCategoría: ${businessDetails.category}\nDirección: ${businessDetails.formattedAddress}\nTeléfono: ${businessDetails.internationalPhoneNumber}\nDescripción: ${businessDetails.editorialSummary || ''}`;

        // Pass the owner's UID in the context for the tools to use
        const aiResponse = await businessChat({
            ownerUid: businessDetails.ownerUid,
            chatHistory: chatHistoryForAI,
            currentMessage: input.currentMessage,
            businessContext,
            agentConfig,
        });

        const usage = aiResponse.usage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
        const cost = calculateCost(agentConfig.model, usage.inputTokens, usage.outputTokens);
        return { 
            response: aiResponse.response, 
            usage, 
            cost, 
            agentConfig,
            debugInfo: { toolInvocations: aiResponse.toolInvocations || [] },
        };
    
    // Priority 3: Default Global Chat (check user's plan)
    } else { 
        agentConfig = await this.getAgentConfigForUser(input.chatHistory);
    }
    
    // --- Execution for Global, Premium, and Lab agents (all use 'migrationChat' flow) ---
    
    // Combine the base tool prompt with the specific personality prompt from the database.
    const finalSystemPrompt = `${agentConfig.systemPrompt}\n\n${BASE_TOOL_PROMPT}`;

    // Execute the flow and pass the sessionId in the context
    const aiResponse = await migrationChat({
        model: agentConfig.model,
        systemPrompt: finalSystemPrompt,
        chatHistory: chatHistoryForAI,
        currentMessage: input.currentMessage,
        sessionId: input.sessionId,
    });
    
    const usage = aiResponse.usage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    const cost = calculateCost(agentConfig.model, usage.inputTokens, usage.outputTokens);
    
    const usedConfig = { model: agentConfig.model, systemPrompt: finalSystemPrompt };
    
    return { 
        response: aiResponse.response, 
        usage, 
        cost, 
        agentConfig: usedConfig,
        debugInfo: { 
            toolInvocations: aiResponse.toolInvocations || [],
            systemPrompt: finalSystemPrompt
        },
    };
  }
}
