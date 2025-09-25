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
import { GooglePlacesAdapter } from '../search/google-places.adapter';
import { FirestoreCacheAdapter } from '../cache/firestore-cache.adapter';


const BASE_TOOL_PROMPT = `### INSTRUCCIONES DE HERRAMIENTAS (¡MUY IMPORTANTE!)
- **PROCESO OBLIGATORIO Y SECUENCIAL:**
    1. Para CUALQUIER pregunta del usuario que no sea un simple saludo (como "hola", "¿qué tal?"), tu ÚNICA acción posible como primer paso es invocar la herramienta \`knowledgeBaseSearch\`.
    2. INMEDIATAMENTE, llamas a la herramienta \`knowledgeBaseSearch\` usando la pregunta exacta del usuario como el parámetro 'query'.
    3. NO generes ningún texto ni intentes responder por tu cuenta antes de recibir el resultado de la herramienta.
    4. Una vez que la herramienta te devuelva la información (dentro de un bloque de texto), y SÓLO ENTONCES, puedes usar esa información para formular tu respuesta final al usuario.
- **EXCEPCIÓN:** Si el usuario solo dice "hola" o una frase de saludo similar, puedes responder amablemente sin usar la herramienta.
- **DOCUMENTOS EN SESIÓN:** Si el usuario menciona que ha subido un documento, el proceso es el mismo: usa \`knowledgeBaseSearch\` para encontrar información sobre ese documento. La herramienta buscará automáticamente en los archivos de la sesión actual.`;


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
    sessionId?: string; // Add sessionId to the interface
    // New optional field to explicitly specify an agent, used by the Agent Lab
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
    const finalSystemPrompt = `${agentConfig.systemPrompt}\n\n${BASE_TOOL_PROMPT}`;

    try {
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
        
        // Pass the full used config to the output for display in the lab
        const usedConfig = { model: agentConfig.model, systemPrompt: finalSystemPrompt };
        
        return { 
            response: aiResponse.response, 
            usage, 
            cost, 
            agentConfig: usedConfig, // Pass the merged config
            debugInfo: { 
                toolInvocations: aiResponse.toolInvocations || [],
                systemPrompt: finalSystemPrompt,
            },
        };
    } catch (error) {
        console.error("[GenkitAgentAdapter] Error during AI generation:", error);
        
        const fullError = {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        };

        return {
            response: "Lo siento, ha ocurrido un error inesperado al procesar tu solicitud. Mi equipo técnico ha sido notificado.",
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: 0,
            agentConfig: agentConfig,
            debugInfo: {
                error: fullError,
                systemPrompt: finalSystemPrompt
            }
        };
    }
  }
}
