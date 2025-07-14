
'use server';

/**
 * @fileOverview An AI agent specialized in providing immigration advice for Colombians moving to Spain.
 * This file contains the logic for processing chat messages, adhering to the correct Genkit API usage.
 */

import {ai} from '@/ai/genkit';
import type { ChatInput, ChatMessage } from '@/lib/types';
import { ChatOutputSchema } from '@/lib/types';
import { getAgentConfig } from '@/services/agent.service';
import type { MessageData } from 'genkit';

/**
 * The main function for handling chat conversations.
 * It transforms the incoming chat history into the format required by `ai.generate`.
 * @param input The chat input containing the history and the new message.
 * @returns A promise that resolves to the AI's response and token usage.
 */
export async function chat(input: ChatInput) {
  const { history, message } = input;
  
  // 1. Get the latest agent configuration from Firestore
  const agentConfig = await getAgentConfig();

  // 2. Transform the history (array of {role, text}) into the required MessageData[] format.
  // The `content` must be an array of parts, e.g., [{ text: '...' }].
  // This resolves the "Unsupported Part type" error.
  const genkitMessages: MessageData[] = history.map((m: ChatMessage) => ({
    role: m.role,
    content: [{ text: m.text }], 
  }));

  // Add the current user message to the conversation history, in the correct format.
  genkitMessages.push({ role: 'user', content: [{ text: message }] });
  
  // 3. Make the generate call using the 'prompt' parameter for chat conversations with MessageData[].
  const { output, usage } = await ai.generate({
    model: agentConfig.model,
    system: agentConfig.systemPrompt,
    prompt: genkitMessages, // Use the 'prompt' parameter with the correctly formatted MessageData array.
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
