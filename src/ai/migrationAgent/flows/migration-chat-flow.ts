
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
  sessionId: z.string().optional().describe("The unique ID of the current chat session. Used for retrieving session-specific documents."),
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
    tools: [knowledgeBaseSearch], // Ensure the tool is explicitly passed to the prompt
    prompt: `{{{systemPrompt}}}
        ---
        TASK: Based on the conversation history and using your tools to search for information, generate the next response for the 'model'. If the user's question seems related to a document they may have uploaded, be sure to use the 'sessionId' when searching the knowledge base. Also, populate the toolInvocations output field with any tools you use.

        CONVERSATION:
        {{#each chatHistory}}
        - {{this.role}}: {{{this.text}}}
        {{/each}}
        - user: {{{currentMessage}}}
        OUTPUT (must be valid JSON that conforms to the schema):
        `,
});

const migrationChatFlow = ai.defineFlow(
    {
        name: 'migrationChatFlow',
        inputSchema: MigrationChatInputSchema,
        outputSchema: ChatOutputSchema,
    },
    async (input) => {
        // Dynamically set the model for the prompt execution
        // Pass the session ID to the tool through the prompt context
        const llmResponse = await prompt(input, { 
            model: input.model as any,
            context: { sessionId: input.sessionId } 
        });

        if (!llmResponse.output) {
            throw new Error('La respuesta de la IA fue vacía.');
        }

        // The toolInvocations are now part of the structured output as defined by ChatOutputSchema.
        // We directly return them from the output object.
        return {
            response: llmResponse.output.response,
            usage: {
                inputTokens: llmResponse.usage.inputTokens || 0,
                outputTokens: llmResponse.usage.outputTokens || 0,
                totalTokens: llmResponse.usage.totalTokens || 0,
            },
            toolInvocations: llmResponse.output.toolInvocations || [],
        };
    }
);
