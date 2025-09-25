
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
import { google } from 'googleapis';

// Define the input schema for the migration chat flow
const MigrationChatInputSchema = z.object({
  model: z.string().describe("The AI model to use for the response (e.g., 'googleai/gemini-1.5-flash-latest')."),
  systemPrompt: z.string().describe("The system prompt that defines the agent's personality and instructions."),
  chatHistory: z.array(z.object({
    role: z.union([ChatRoleSchema, z.literal('system')]),
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
    return migrationChatFlow(input, { context: { sessionId: input.sessionId }});
}


// REFACTORED: This flow is now built according to official Genkit chat documentation.
// It programmatically constructs the prompt array instead of using a string template.
const migrationChatFlow = ai.defineFlow(
    {
        name: 'migrationChatFlow',
        inputSchema: MigrationChatInputSchema,
        outputSchema: ChatOutputSchema,
    },
    async (input, { context }) => { // The context is passed here by the caller
        
        // Map our simple {role, text} history to the format Genkit's `generate` expects
        const history = input.chatHistory.map(message => ({
            role: message.role,
            content: [{ text: message.text }],
        }));
        
        try {
            const llmResponse = await ai.generate({
                model: input.model as any,
                tools: [knowledgeBaseSearch],
                system: input.systemPrompt,
                history: history,
                prompt: input.currentMessage,
                context: context, // Pass the received context down to the generate call
            });
            
            if (!llmResponse.text) {
                console.warn('[migrationChatFlow] LLM text response was empty. Falling back.');
                return {
                    response: "Lo siento, no he podido procesar esa respuesta. ¿Podrías intentarlo de nuevo?",
                    usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
                    toolInvocations: [],
                };
            }

            const usage = llmResponse.usage;

            return {
                response: llmResponse.text,
                usage: {
                    inputTokens: usage.inputTokens || 0,
                    outputTokens: usage.outputTokens || 0,
                    totalTokens: usage.totalTokens,
                },
                toolInvocations: llmResponse.toolRequests?.map(tr => ({
                    tool: tr.name,
                    result: tr.output,
                })) || [],
            };
        } catch (error) {
            console.error('[migrationChatFlow] Error during generation:', error);
            if (error instanceof Error) {
                throw new Error(`AI Generation failed: ${error.message}`);
            }
            throw new Error('An unknown error occurred during AI generation.');
        }
    }
);
