
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
import { ChatOutputSchema, ChatRoleSchema } from '@/lib/chat-types';


// Define the input schema for the business chat flow
const BusinessChatFlowInputSchema = z.object({
  businessId: z.string().describe('The unique ID of the business.'),
  chatHistory: z.array(z.object({
    role: ChatRoleSchema, // Use the unified ChatRoleSchema
    text: z.string(),
  })).describe('The history of the conversation so far, including user, AI (model), and admin messages.'),
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
        En la conversación, pueden participar tres roles: 'user' (el cliente), 'model' (tú, el asistente IA) y 'admin' (un humano del negocio que puede intervenir). Trata los mensajes del 'admin' como una fuente de información verídica y autorizada.

        ### PROCESO DE RESPUESTA OBLIGATORIO Y SECUENCIAL
        1.  **IDENTIFICAR INTENCIÓN:** Analiza el mensaje del usuario.
            - Si es una pregunta general (sobre horarios, servicios, etc.), usa la herramienta \`getBusinessInfoTool\`.
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
