
'use server';

/**
 * @fileOverview A specialized AI agent for handling conversations for individual businesses.
 * This flow is context-aware and uses tools to fetch specific business information and manage appointments.
 *
 * - businessChatFlow - The main flow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getBusinessInfoTool } from '../tools/get-business-info-tool';
import { getAvailableSlots, createAppointment } from '../tools/google-calendar-tools';
import { ChatOutputSchema } from '@/lib/types';


// Define the input schema for the business chat flow
const BusinessChatFlowInputSchema = z.object({
  businessId: z.string().describe('The unique ID of the business.'),
  chatHistory: z.array(z.any()).describe('The history of the conversation so far.'),
  currentMessage: z.string().describe("The user's latest message."),
  currentDate: z.string().optional().describe("La fecha y hora actual en formato ISO para dar contexto al modelo."),
});
export type BusinessChatFlowInput = z.infer<typeof BusinessChatFlowInputSchema>;


/**
 * The main exported function to be called by server actions.
 * It triggers the Genkit flow.
 */
export async function businessChat(input: Omit<BusinessChatFlowInput, 'currentDate'>) {
    // Add the current date to the input for the flow
    const flowInput: BusinessChatFlowInput = {
      ...input,
      currentDate: new Date().toISOString(),
    };
    return businessChatFlow(flowInput);
}


const prompt = ai.definePrompt({
    name: 'businessChatPrompt',
    input: { schema: BusinessChatFlowInputSchema },
    output: { schema: ChatOutputSchema },
    tools: [getBusinessInfoTool, getAvailableSlots, createAppointment],
    system: `
        ### CONTEXTO
        Eres un asistente de inteligencia artificial amigable, profesional y extremadamente eficiente para un negocio específico. Tu misión es responder a las preguntas de los clientes y gestionar citas basándote ÚNICAMENTE en la información proporcionada por tus herramientas.
        La fecha y hora actual es: {{currentDate}}. Úsala como referencia para interpretar las peticiones del usuario (ej. "mañana", "próximo lunes").

        ### PROCESO DE RESPUESTA OBLIGATORIO
        1.  **IDENTIFICAR INTENCIÓN:** Analiza el mensaje del usuario.
            - Si es una pregunta general (sobre horarios, servicios, etc.), usa la herramienta \`getBusinessInfoTool\`.
            - Si es sobre agendar o consultar citas, ve al paso 2.
        2.  **GESTIÓN DE CITAS - CONSULTAR DISPONIBILIDAD:**
            - **Paso 2.1 (DEDUCIR FECHA):** Si el usuario pide una cita (ej. "quisiera reservar para mañana", "disponibilidad para el 25 de julio"), tu primer trabajo es DEDUCIR la fecha exacta en formato YYYY-MM-DD usando la fecha actual como referencia.
            - **Paso 2.2 (USAR HERRAMIENTA):** Una vez deducida la fecha, DEBES usar la herramienta \`getAvailableSlots\` con esa fecha para ver los huecos libres.
            - **Paso 2.3 (RESPONDER CON DATOS):** Basa tu respuesta ESTRICTAMENTE en la salida de la herramienta \`getAvailableSlots\`.
                - Si la herramienta devuelve una lista de horarios, preséntalos al usuario. Ejemplo: "¡Claro! Para el día [fecha], tengo los siguientes horarios disponibles: [lista de horarios]. ¿Cuál te viene bien?".
                - Si la herramienta devuelve una lista vacía, informa al usuario. Ejemplo: "Lo siento, parece que para el día [fecha] ya no quedan huecos disponibles. ¿Te gustaría mirar otro día?".
        3.  **GESTIÓN DE CITAS - CREAR CITA:**
            - SOLO si el usuario elige un horario específico de la lista que le has ofrecido, utiliza la herramienta \`createAppointment\` para crear el evento.
            - Una vez creada, confirma la cita al usuario. Ejemplo: "¡Perfecto! Tu cita para el [fecha] a las [hora] ha sido confirmada. ¡Te esperamos!".

        ### POLÍTICAS
        - **NO INVENTES DISPONIBILIDAD.** Tu única fuente de verdad sobre los horarios es la herramienta \`getAvailableSlots\`.
        - **NO ASUMAS LA FECHA.** Si no puedes deducir una fecha clara del mensaje del usuario, pregúntale directamente.
        - Sé siempre amable, servicial y representa al negocio de la mejor manera posible.
    `,
    prompt: `
        Historial de la Conversación:
        {{#each chatHistory}}
            {{this.role}}: {{this.text}}
        {{/each}}
        
        Nuevo Mensaje del Usuario:
        {{currentMessage}}
    `,
});

const businessChatFlow = ai.defineFlow(
    {
        name: 'businessChatFlow',
        inputSchema: BusinessChatFlowInputSchema,
        outputSchema: ChatOutputSchema,
    },
    async (input) => {
        const { output, usage } = await prompt(input);

        if (!output) {
            throw new Error('La respuesta de la IA fue vacía.');
        }

        return {
            response: output.response,
            usage: {
                inputTokens: usage.inputTokens || 0,
                outputTokens: usage.outputTokens || 0,
                totalTokens: usage.totalTokens || 0,
            }
        };
    }
);
