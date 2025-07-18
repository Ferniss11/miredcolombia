
'use server';

/**
 * @fileOverview A specialized AI agent for handling conversations for individual businesses.
 * This flow is context-aware and uses tools to fetch specific business information and manage appointments.
 *
 * - businessChat - The main flow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getBusinessInfoTool } from '../tools/get-business-info-tool';
import { getAvailableSlots, createAppointment } from '../tools/google-calendar-tools';
import { ChatOutputSchema, ChatRoleSchema } from '@/lib/chat-types';
import type { BusinessAgentConfig } from '@/lib/types';


// Define the input schema for the business chat flow
const BusinessChatFlowInputSchema = z.object({
  businessId: z.string().describe('The unique ID of the business.'),
  chatHistory: z.array(z.object({
    role: ChatRoleSchema,
    text: z.string(),
  })).describe('The history of the conversation so far, including user, AI (model), and admin messages.'),
  currentMessage: z.string().describe("The user's latest message."),
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


const prompt = ai.definePrompt({
    name: 'businessChatPrompt',
    input: { schema: BusinessChatFlowInputSchema },
    output: { schema: ChatOutputSchema },
    tools: [getBusinessInfoTool, getAvailableSlots, createAppointment],
    system: `{{agentConfig.systemPrompt}}`,
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
