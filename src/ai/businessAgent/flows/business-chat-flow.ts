
'use server';

/**
 * @fileOverview A specialized AI agent for handling conversations for individual businesses.
 * This flow is context-aware and uses tools to fetch specific business information and manage appointments.
 *
 * - businessChat - The main flow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAvailableSlots, createAppointment } from '../tools/google-calendar-tools';
import { ChatOutputSchema, ChatRoleSchema } from '@/lib/chat-types';

// Define the input schema for the business chat flow
const BusinessChatFlowInputSchema = z.object({
  ownerUid: z.string().describe("The UID of the business owner, required for calendar operations."),
  chatHistory: z.array(z.object({
    role: ChatRoleSchema,
    text: z.string(),
  })).describe('The history of the conversation so far, including user, AI (model), and admin messages.'),
  currentMessage: z.string().describe("The user's latest message."),
  businessContext: z.string().describe("A summary of the business's public information."),
  agentConfig: z.object({
    model: z.string(),
    systemPrompt: z.string(),
  }),
});
export type BusinessChatFlowInput = z.infer<typeof BusinessChatFlowInputSchema>;


/**
 * The main exported function to be called by server actions.
 * It triggers the Genkit flow.
 */
export async function businessChat(input: BusinessChatFlowInput) {
    return businessChatFlow(input);
}

// Define the prompt with more intelligent instructions
const prompt = ai.definePrompt({
    name: 'businessChatPrompt',
    input: { schema: BusinessChatFlowInputSchema },
    output: { schema: ChatOutputSchema },
    tools: [getAvailableSlots, createAppointment],
    system: `### CONTEXTO GENERAL
Eres un asistente de inteligencia artificial amigable, profesional y extremadamente eficiente para un negocio específico. Tu misión es responder a las preguntas de los clientes y gestionar citas basándote ÚNICAMENTE en la información proporcionada por tus herramientas y el contexto del negocio que se te facilita. En la conversación, pueden participar tres roles: 'user' (el cliente), 'model' (tú, el asistente IA) y 'admin' (un humano del negocio que puede intervenir). Trata los mensajes del 'admin' como una fuente de información verídica y autorizada.

### INFORMACIÓN DEL NEGOCIO (Contexto Principal)
Esta es la información pública sobre el negocio con el que estás hablando. Úsala como tu fuente principal de verdad para responder a las preguntas del usuario sobre horarios, dirección, servicios, etc.

{{{businessContext}}}
---
### FECHA Y HORA ACTUAL
La fecha y hora actual es: {{currentDate}}. Úsala como referencia para interpretar las peticiones del usuario (ej. "mañana" es {{tomorrow}}, "próximo lunes").

---
### PROCESO DE RESPUESTA OBLIGATORIO Y SECUENCIAL
1.  **IDENTIFICAR INTENCIÓN:** Analiza el mensaje del usuario.
    - Si es una pregunta general sobre el negocio (horarios, dirección, servicios), usa la información del bloque "INFORMACIÓN DEL NEGOCIO" para responder.
    - Si es sobre agendar o consultar citas, ve al paso 2.

2.  **CONSULTAR DISPONIBILIDAD (SIEMPRE PRIMERO):**
    - **Paso 2.1 (DEDUCIR FECHA):** Si el usuario pide una cita (ej. "quisiera reservar para mañana", "disponibilidad para el 25 de julio"), tu primer trabajo es DEDUCIR la fecha exacta en formato YYYY-MM-DD usando la fecha actual que se te proporciona.
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
        // Calculate current date and tomorrow's date to inject into the prompt
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const promptInput = {
            ...input,
            currentDate: now.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }),
            tomorrow: tomorrow.toISOString().split('T')[0],
        };

        const { output, usage } = await prompt(promptInput, { context: { uid: input.ownerUid } });

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
