
'use server';

/**
 * @fileOverview Simplified AI chat flow.
 * This file contains a direct, simplified function for handling chat interactions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ChatOutputSchema } from '@/lib/types';

// Define the input schema for this simplified chat function
const ChatFlowInputSchema = z.object({
    model: z.string().describe("The AI model to use for the response (e.g., 'googleai/gemini-1.5-flash-latest')."),
    systemPrompt: z.string().describe("The system prompt that defines the AI's personality and instructions."),
    prompt: z.string().describe("The user's message, potentially including the conversation history as a single string."),
});
type ChatFlowInput = z.infer<typeof ChatFlowInputSchema>;

/**
 * A simple, direct function to interact with the AI model for a chat response.
 * @param input An object containing the system prompt and the user's prompt.
 * @returns A promise that resolves to the AI's response and token usage.
 */
export async function chat(input: ChatFlowInput) {
  try {
    const { model, systemPrompt, prompt } = ChatFlowInputSchema.parse(input);

    // Call the AI with a clear system prompt and a simple text prompt.
    // This avoids the "Unsupported Part type" error by not sending complex objects.
    const { output, usage } = await ai.generate({
      model: model,
      system: systemPrompt,
      prompt: prompt,
      output: {
        schema: ChatOutputSchema,
      },
    });
    
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
  } catch (error) {
    console.error('Error in chat flow:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during AI generation.";
    throw new Error(errorMessage);
  }
}
