
'use server';

/**
 * @fileOverview An AI agent specialized in providing immigration advice for Colombians moving to Spain.
 * This file contains the logic for processing chat messages.
 */

import {ai} from '@/ai/genkit';
import type { MessageData } from 'genkit';
import { type ChatInput, ChatOutputSchema, type ChatOutput } from '@/lib/types';
import { getAgentConfig } from '@/services/agent.service';

/**
 * The main function for handling chat conversations.
 * It transforms the history into the format required by Genkit and calls the AI model.
 * @param input The chat input containing the history and the new message.
 * @returns A promise that resolves to the AI's response and token usage.
 */
export async function chat(input: ChatInput): Promise<ChatOutput> {
  const { history, message } = input;
  
  // 1. Get the latest agent configuration from Firestore
  const agentConfig = await getAgentConfig();

  // 2. Transform the client-side history (array of {role, text}) into the Genkit MessageData format.
  // This is the critical step to prevent the "Unsupported Part type" error.
  const messages: MessageData[] = history.map((m: any) => ({
      role: m.role,
      content: [{ text: m.text || m.content }], // Safely handle both `text` and `content` keys
  }));

  // Add the current user message in the correct format
  messages.push({ role: 'user', content: [{ text: message }] });

  // 3. Make the generate call using the retrieved configuration and the formatted messages
  const { output, usage } = await ai.generate({
    model: agentConfig.model,
    system: agentConfig.systemPrompt,
    prompt: messages, // Pass the correctly formatted message array
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
