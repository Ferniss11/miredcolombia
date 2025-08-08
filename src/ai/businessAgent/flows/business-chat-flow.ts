
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
    system: `{{agentConfig.systemPrompt}}

### INFORMACIÓN DEL NEGOCIO (Contexto Principal)
Esta es la información pública sobre el negocio con el que estás hablando. Úsala como tu fuente principal de verdad para responder a las preguntas del usuario sobre horarios, servicios, etc.

{{{businessContext}}}
---
### FECHA Y HORA ACTUAL
La fecha y hora actual es: {{currentDate}}. Úsala como referencia para interpretar las peticiones del usuario (ej. "mañana" es {{tomorrow}}, "próximo lunes").
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
