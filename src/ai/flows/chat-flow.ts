
'use server';

/**
 * @fileOverview An AI agent specialized in providing immigration advice for Colombians moving to Spain.
 * This file contains the logic for processing chat messages, adhering to the correct Genkit API usage.
 */

import {ai} from '@/ai/genkit';
import type { ChatInput, ChatOutput } from '@/lib/types';
import { ChatOutputSchema } from '@/lib/types';
import { getAgentConfig } from '@/services/agent.service';

/**
 * The main function for handling chat conversations.
 * It uses the 'messages' parameter as specified in the Genkit documentation for multi-turn conversations.
 * @param input The chat input containing the history and the new message.
 * @returns A promise that resolves to the AI's response and token usage.
 */
export async function chat(input: ChatInput): Promise<ChatOutput> {
  const { history, message } = input;
  
  // 1. Get the latest agent configuration from Firestore
  const agentConfig = await getAgentConfig();

  // 2. Construct the message history in the correct format for the 'messages' parameter.
  // The content for each message is a simple string, as per Genkit documentation.
  const messages = history.map((m: any) => ({
    role: m.role,
    // Use `m.text` or `m.content` for compatibility, ensuring content is a string.
    content: m.text || m.content, 
  }));

  // Add the current user message to the conversation history
  messages.push({ role: 'user', content: message });
  
  // 3. Make the generate call using the 'messages' parameter for multi-turn chat.
  const { output, usage } = await ai.generate({
    model: agentConfig.model,
    system: agentConfig.systemPrompt,
    messages: messages, // Use the 'messages' parameter for chat conversations.
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
