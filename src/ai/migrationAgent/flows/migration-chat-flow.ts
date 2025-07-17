
'use server';

/**
 * @fileOverview A specialized AI agent for handling conversations about migrating to Spain.
 * This flow is context-aware and uses tools to fetch specific information from a knowledge base.
 *
 * - migrationChat - The main flow function.
 * - MigrationChatInput - The input type for the migrationChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ChatOutputSchema, ChatRoleSchema } from '@/lib/chat-types';
import { knowledgeBaseSearch } from '@/ai/tools/knowledge-base-search';


// Define the input schema for the migration chat flow
const MigrationChatInputSchema = z.object({
  model: z.string().describe("The AI model to use for the response (e.g., 'googleai/gemini-1.5-flash-latest')."),
  systemPrompt: z.string().describe("The system prompt that defines the agent's personality and instructions."),
  chatHistory: z.array(z.object({
    role: ChatRoleSchema,
    text: z.string(),
  })).describe("The history of the conversation so far, including user, AI (model), and admin messages."),
  currentMessage: z.string().describe("The user's latest message."),
});
export type MigrationChatInput = z.infer<typeof MigrationChatInputSchema>;


/**
 * The main exported function to be called by server actions.
 * It triggers the Genkit flow.
 */
export async function migrationChat(input: MigrationChatInput) {
    return migrationChatFlow(input);
}


const prompt = ai.definePrompt({
    name: 'migrationChatPrompt',
    input: { schema: MigrationChatInputSchema },
    output: { schema: ChatOutputSchema },
    tools: [knowledgeBaseSearch],
    system: `{{systemPrompt}}`,
    prompt: `
        Historial de la Conversación:
        {{#each chatHistory}}
            {{this.role}}: {{this.text}}
        {{/each}}
        
        Nuevo Mensaje del Usuario:
        {{currentMessage}}
    `,
});

const migrationChatFlow = ai.defineFlow(
    {
        name: 'migrationChatFlow',
        inputSchema: MigrationChatInputSchema,
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
