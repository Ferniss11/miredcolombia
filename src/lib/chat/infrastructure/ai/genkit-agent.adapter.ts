
// src/lib/chat/infrastructure/ai/genkit-agent.adapter.ts
import type { AgentAdapter } from './agent.adapter';
import type { ChatMessage } from '../../domain/chat-message.entity';
import type { TokenUsage, BusinessAgentConfig, AgentConfig } from '@/lib/chat-types';
import { adminAuth, adminDb } from '@/lib/firebase/admin-config';
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

const DEFAULT_BUSINESS_PROMPT = `### CONTEXTO
Eres un asistente de inteligencia artificial amigable, profesional y extremadamente eficiente para un negocio específico. Tu misión es responder a las preguntas de los clientes y gestionar citas basándote ÚNICAMENTE en la información proporcionada por tus herramientas y el contexto del negocio que se te facilita.

### PROCESO DE RESPUESTA OBLIGATORIO Y SECUENCIAL
1.  **IDENTIFICAR INTENCIÓN:** Analiza el mensaje del usuario.
    - Si es una pregunta general sobre el negocio (horarios, dirección, servicios), usa la información del bloque "INFORMACIÓN DEL NEGOCIO" para responder.
    - Si es sobre agendar o consultar citas, ve al paso 2.

2.  **CONSULTAR DISPONIBILIDAD (SIEMPRE PRIMERO):**
    - Una vez deducida la fecha, DEBES usar la herramienta \`getAvailableSlots\` con esa fecha para ver los huecos libres.
    - Basa tu respuesta ESTRICTAMENTE en la salida de la herramienta \`getAvailableSlots\`.

3.  **CREAR CITA (SÓLO TRAS CONFIRMACIÓN):**
    - Si el usuario elige un horario, pregunta para confirmar.
    - SOLO si el usuario responde afirmativamente, DEBES usar la herramienta \`createAppointment\`.
    - Después de que la herramienta se ejecute con éxito, confirma la cita al usuario.

### POLÍTICAS
- **PROHIBIDO CONFIRMAR SIN USAR LA HERRAMIENTA:** NUNCA digas que una cita está confirmada si no has usado la herramienta \`createAppointment\`.
- **NO INVENTES DISPONIBILIDAD:** Tu única fuente de verdad sobre los horarios es la herramienta \`getAvailableSlots\`.`;


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
            const plan = userRecord.customClaims?.valeria_plan;

            if (plan === 'valeria_premium' || plan === 'valeria_pro') {
                // The agentId in Firestore is 'valeria_premium', not 'plan_valeria_premium'
                return this.userRepository.getAgentConfig(plan);
            }
        } catch (error) {
            console.warn(`Could not get auth user for ID ${userId}, falling back to global agent.`, error);
        }
    }
    
    // Default to global agent
    return this.userRepository.getAgentConfig('global');
  }


  async getCompletion(input: {
    chatHistory: ChatMessage[];
    currentMessage: string;
    businessId?: string;
  }): Promise<{ response: string; usage: TokenUsage; cost: number; }> {
    
    const chatHistoryForAI = input.chatHistory.map(m => ({
      role: m.role === 'admin' ? 'model' : m.role, // Treat admin messages as model messages from AI's perspective
      text: m.role === 'admin' ? `[Mensaje del Administrador: ${m.text}]` : m.text,
    }));
    
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
      });
      
      const usage = aiResponse.usage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
      const cost = calculateCost(agentConfig.model, usage.inputTokens, usage.outputTokens);
      
      return { response: aiResponse.response, usage, cost };
    }
  }
}
