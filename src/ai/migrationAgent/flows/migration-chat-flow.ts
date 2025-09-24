
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


// REFACTORED: The prompt object is no longer needed. We will call the model directly.
const migrationChatFlow = ai.defineFlow(
    {
        name: 'migrationChatFlow',
        inputSchema: MigrationChatInputSchema,
        outputSchema: ChatOutputSchema,
    },
    async (input) => {
        // Construct the prompt history programmatically, which is the correct Genkit v1.x approach for chat.
        // CRITICAL FIX: Map the history to the format { role, text } that the AI model expects.
        // The previous implementation was sending the entire database object, causing a silent failure.
        const history = input.chatHistory.map(message => ({
            text: message.role === 'admin' ? `[Mensaje del Administrador: ${message.text}]` : message.text,
            role: message.role === 'user' ? 'user' : 'model', // Treat 'admin' messages as if they came from the 'model'
        }));
        
        try {
            const llmResponse = await ai.generate({
                model: input.model as any,
                tools: [knowledgeBaseSearch],
                system: input.systemPrompt, // Pass the system instructions here
                prompt: [
                    ...history, // Spread the existing conversation history
                    { text: input.currentMessage, role: 'user' }, // The user's latest message
                ],
                // Pass the session ID to the tool context
                context: { sessionId: input.sessionId }, 
            });
            
            const output = llmResponse.output;

            if (!output || !llmResponse.text) {
                // If the model truly returns nothing, provide a graceful fallback.
                return {
                    response: "Lo siento, no he podido procesar esa respuesta. ¿Podrías intentarlo de nuevo?",
                    usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
                    toolInvocations: [],
                };
            }

            return {
                response: llmResponse.text,
                usage: {
                    inputTokens: llmResponse.usage?.inputTokens || 0,
                    outputTokens: llmResponse.usage?.outputTokens || 0,
                    totalTokens: llmResponse.usage?.totalTokens || 0,
                },
                // Map tool calls to the expected format if they exist
                toolInvocations: llmResponse.toolRequests?.map(tr => ({
                    tool: tr.name,
                    result: tr.output,
                })) || [],
            };
        } catch (error) {
            console.error('[migrationChatFlow] Error during generation:', error);
            // It's better to throw so the api-handler can catch and format the error response.
            // This provides more detailed error messages on the client side for debugging.
            if (error instanceof Error) {
                throw new Error(`AI Generation failed: ${error.message}`);
            }
            throw new Error('An unknown error occurred during AI generation.');
        }
    }
);
