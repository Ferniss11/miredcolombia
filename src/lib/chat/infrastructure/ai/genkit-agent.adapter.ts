
// src/lib/chat/infrastructure/ai/genkit-agent.adapter.ts
import type { AgentAdapter } from './agent.adapter';
import type { ChatMessage } from '../../domain/chat-message.entity';
import type { TokenUsage, BusinessAgentConfig } from '@/lib/chat-types';
import { adminDb } from '@/lib/firebase/admin-config';
import { calculateCost } from '@/lib/ai-costs';

// Import the specific Genkit flows
import { migrationChat } from '@/ai/migrationAgent/flows/migration-chat-flow';
import { businessChat } from '@/ai/businessAgent/flows/business-chat-flow';
import { FirestoreUserRepository } from '@/lib/user/infrastructure/persistence/firestore-user.repository';
import { GetBusinessDetailsUseCase } from '@/lib/directory/application/get-business-details.use-case';
import { FirestoreDirectoryRepository } from '@/lib/directory/infrastructure/persistence/firestore-directory.repository';
import { GooglePlacesAdapter } from '@/lib/directory/infrastructure/search/google-places.adapter';
import { FirestoreCacheAdapter } from '@/lib/directory/infrastructure/cache/firestore-cache.adapter';


const DEFAULT_BUSINESS_PROMPT = `### CONTEXTO
Eres un asistente de inteligencia artificial amigable, profesional y extremadamente eficiente para un negocio específico. Tu misión es responder a las preguntas de los clientes y gestionar citas basándote ÚNICAMENTE en la información proporcionada por tus herramientas y el contexto del negocio que se te facilita.
La fecha y hora actual es: {{currentDate}}. Úsala como referencia para interpretar las peticiones del usuario (ej. "mañana", "próximo lunes").
En la conversación, pueden participar tres roles: 'user' (el cliente), 'model' (tú, el asistente IA) y 'admin' (un humano del negocio que puede intervenir). Trata los mensajes del 'admin' como una fuente de información verídica y autorizada.

### PROCESO DE RESPUESTA OBLIGATORIO Y SECUENCIAL
1.  **IDENTIFICAR INTENCIÓN:** Analiza el mensaje del usuario.
    - Si es una pregunta general sobre el negocio (horarios, dirección, servicios), usa la información del bloque "INFORMACIÓN DEL NEGOCIO" para responder.
    - Si es sobre agendar o consultar citas, ve al paso 2.

2.  **CONSULTAR DISPONIBILIDAD (SIEMPRE PRIMERO):**
    - **Paso 2.1 (DEDUCIR FECHA):** Si el usuario pide una cita (ej. "quisiera reservar para mañana", "disponibilidad para el 25 de julio"), tu primer trabajo es DEDUCIR la fecha exacta en formato YYYY-MM-DD.
    - **Paso 2.2 (USAR HERRAMIENTA OBLIGATORIAMENTE):** Una vez deducida la fecha, DEBES usar la herramienta \`getAvailableSlots\` con esa fecha para ver los huecos libres.
    - **Paso 2.3 (RESPONDER CON DATOS):** Basa tu respuesta ESTRICTAMENTE en la salida de la herramienta \`getAvailableSlots\`.
        - Si hay horarios: preséntalos claramente. Ejemplo: "¡Claro! Para el día [fecha], tengo estos horarios: [lista]. ¿Cuál te viene bien?".
        - Si NO hay horarios: informa al usuario. Ejemplo: "Lo siento, para el día [fecha] no quedan huecos. ¿Quieres mirar otro día?".

3.  **CREAR CITA (SÓLO TRAS CONFIRMACIÓN):**
    - **Paso 3.1 (PEDIR CONFIRMACIÓN):** Si el usuario elige un horario de la lista que le has ofrecido, tu siguiente respuesta DEBE SER una pregunta para confirmar. Ejemplo: "Perfecto, ¿te agendo entonces para el [fecha] a las [hora]?".
    - **Paso 3.2 (ESPERAR "SÍ" Y USAR HERRAMIENTA):** SOLO y únicamente si el usuario responde afirmativamente a tu pregunta de confirmación (con "sí", "vale", "confirma", etc.), DEBES usar la herramienta \`createAppointment\` para crear el evento en el calendario. Pasa la fecha y hora correctas, y un resumen como "Cita con cliente".
    - **Paso 3.3 (CONFIRMAR DESPUÉS DE LA HERRAMIENTA):** Después de que la herramienta \`createAppointment\` se ejecute con éxito, confirma la cita al usuario. Ejemplo: "¡Listo! Tu cita para el [fecha] a las [hora] ha sido confirmada. ¡Te esperamos!".

### POLÍTICAS
- **PROHIBIDO CONFIRMAR SIN USAR LA HERRAMIENTA:** NUNCA digas que una cita está confirmada si no has usado la herramienta \`createAppointment\` en el paso inmediatamente anterior.
- **NO INVENTES DISPONIBILIDAD:** Tu única fuente de verdad sobre los horarios es la herramienta \`getAvailableSlots\`.
- Sé siempre amable, servicial y representa al negocio de la mejor manera posible.`;


/**
 * An adapter that uses Genkit to provide AI agent completions.
 * It dynamically selects the appropriate agent (global vs. business) based on context.
 */
export class GenkitAgentAdapter implements AgentAdapter {
  private userRepository: FirestoreUserRepository;
  private getBusinessDetailsUseCase: GetBusinessDetailsUseCase;

  constructor() {
    this.userRepository = new FirestoreUserRepository();
    
    // Instantiate dependencies for the use case
    const directoryRepository = new FirestoreDirectoryRepository();
    const searchAdapter = new GooglePlacesAdapter();
    const cacheAdapter = new FirestoreCacheAdapter();
    
    this.getBusinessDetailsUseCase = new GetBusinessDetailsUseCase(
        directoryRepository,
        searchAdapter,
        cacheAdapter
    );
  }

  private async getBusinessAgentConfig(businessId: string): Promise<BusinessAgentConfig> {
    const defaultConfig: BusinessAgentConfig = {
      model: 'googleai/gemini-1.5-flash-latest',
      systemPrompt: DEFAULT_BUSINESS_PROMPT,
    };
    
    if (!adminDb) return defaultConfig;

    // The owner's config is stored on the user profile now
    const userProfile = await this.userRepository.findUserByBusinessId(businessId);
    if (userProfile?.businessProfile?.agentConfig) {
        return userProfile.businessProfile.agentConfig;
    }

    return defaultConfig;
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
      // --- Business Agent Logic ---
      const agentConfig = await this.getBusinessAgentConfig(input.businessId);
      const systemPrompt = agentConfig.systemPrompt.replace('{{currentDate}}', new Date().toISOString());

      // Fetch business details to provide as context
      const businessDetails = await this.getBusinessDetailsUseCase.execute(input.businessId);
      const businessContext = businessDetails 
        ? `Nombre: ${businessDetails.displayName}\nCategoría: ${businessDetails.category}\nDirección: ${businessDetails.formattedAddress}\nTeléfono: ${businessDetails.internationalPhoneNumber}\nDescripción: ${businessDetails.editorialSummary || ''}`
        : "No se encontró información del negocio.";

      const aiResponse = await businessChat({
        businessId: input.businessId,
        chatHistory: chatHistoryForAI,
        currentMessage: input.currentMessage,
        businessContext,
        agentConfig: { ...agentConfig, systemPrompt },
      });
      
      const usage = aiResponse.usage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
      const cost = calculateCost(agentConfig.model, usage.inputTokens, usage.outputTokens);

      return { response: aiResponse.response, usage, cost };

    } else {
      // --- Global Migration Agent Logic ---
      const agentConfig = await this.userRepository.getGlobalAgentConfig();
      const aiResponse = await migrationChat({
        model: agentConfig.model,
        systemPrompt: agentConfig.systemPrompt,
        chatHistory: chatHistoryForAI,
        currentMessage: input.currentMessage,
      });
      
      const usage = aiResponse.usage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
      const cost = calculateCost(agentConfig.model, usage.inputTokens, usage.outputTokens);
      
      return { response: aiResponse.response, usage, cost };
    }
  }
}
