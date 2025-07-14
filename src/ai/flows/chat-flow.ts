
'use server';

/**
 * @fileOverview An AI agent specialized in providing immigration advice for Colombians moving to Spain.
 * This file contains the logic for processing chat messages.
 */

import {ai} from '@/ai/genkit';
import type { MessageData } from 'genkit';
import { ChatInputSchema, type ChatInput, ChatOutputSchema, type ChatOutput } from '@/lib/types';
import { getAgentConfig } from '@/services/agent.service';

/**
 * Handles the chat logic by taking history and a new message,
 * formatting it for the AI, and returning the AI's response.
 * @param input The user's message and the chat history.
 * @returns The AI's response and token usage information.
 */
export async function chat(input: ChatInput): Promise<ChatOutput> {
  const { history, message } = input;
  
  // 1. Get the latest agent configuration from Firestore
  const agentConfig = await getAgentConfig();

  // 2. Map the client-side history (which has { role, content: string })
  // to the MessageData[] format required by ai.generate, which is { role, content: [{ text: string }] }
  const messages: MessageData[] = history.map((m: any) => ({
    role: m.role,
    content: [{ text: m.content }],
  }));

  // Add the current user message to the conversation history for the AI
  messages.push({ role: 'user', content: [{ text: message }] });

  // 3. Make the generate call using the retrieved configuration and formatted messages
  const { output, usage } = await ai.generate({
    model: agentConfig.model,
    system: agentConfig.systemPrompt,
    prompt: messages,
    output: {
      schema: ChatOutputSchema,
    },
  });

  if (!output) {
    throw new Error('No se pudo generar una respuesta.');
  }

  return {
    ...output,
    usage: {
      inputTokens: usage.inputTokens || 0,
      outputTokens: usage.outputTokens || 0,
      totalTokens: usage.totalTokens || 0,
    }
  };
}

/**
 * Defines a Genkit flow for the chat functionality.
 * This wraps the main chat logic, making it available to the Genkit developer UI.
 */
const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    // Call the underlying chat function which is easier to test
    return await chat(input);
  }
);
