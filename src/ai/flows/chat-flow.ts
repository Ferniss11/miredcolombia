
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
 * The main Genkit flow for handling chat conversations.
 * It validates the input and calls the core chat logic.
 */
export const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { history, message } = input;
    
    // 1. Get the latest agent configuration from Firestore
    const agentConfig = await getAgentConfig();

    // 2. Correctly map the history and add the new message to match the MessageData[] format.
    // The history from the client might be in a simpler format, so we ensure it's correct here.
    const messages: MessageData[] = history.map((m: any) => ({
      role: m.role,
      content: [{ text: m.text || m.content }], // Handle both `text` and `content` properties for safety
    }));

    // Add the current user message
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
);
