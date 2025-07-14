
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
  
  const agentConfig = await getAgentConfig();

  // Map the client-side history to the MessageData[] format required by ai.generate.
  // The history can come in two formats:
  // 1. From Firestore: { role: '...', text: '...' }
  // 2. From client state: { role: '...', text: '...' } (after the fix)
  // This mapping correctly handles both by looking for the 'text' property.
  const messages: MessageData[] = history.map((m: any) => ({
    role: m.role,
    content: [{ text: m.text }],
  }));

  // Add the current user message to the conversation history for the AI
  messages.push({ role: 'user', content: [{ text: message }] });

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
