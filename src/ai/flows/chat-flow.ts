
'use server';

/**
 * @fileOverview An AI agent specialized in providing immigration advice for Colombians moving to Spain.
 *
 * - chat - A function that handles the conversational chat process.
 */

import {ai} from '@/ai/genkit';
import type { MessageData } from 'genkit';
import { ChatInputSchema, type ChatInput, ChatOutputSchema, type ChatOutput } from '@/lib/types';
import { getAgentConfig } from '@/services/agent.service';
import { knowledgeBaseSearch } from '../tools/knowledge-base-search';

export async function chat(input: ChatInput): Promise<ChatOutput> {
  const { history, message } = input;
  
  // 1. Get the latest agent configuration from Firestore
  const agentConfig = await getAgentConfig();

  // 2. Make the generate call using the retrieved configuration
  const { output, usage } = await ai.generate({
    model: agentConfig.model,
    system: agentConfig.systemPrompt,
    tools: [knowledgeBaseSearch],
    prompt: [
        ...history.map(m => ({
            role: m.role,
            content: [{ text: m.content as string }],
        }) as MessageData),
        { role: 'user', content: [{ text: message }] },
    ] as MessageData[],
    output: {
      schema: ChatOutputSchema,
    },
    config: {
        // We can add specific configs here if needed, like temperature
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

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    // Call the underlying chat function which is easier to test
    const result = await chat(input);
    return result;
  }
);

export async function invokeChatFlow(input: ChatInput): Promise<ChatOutput> {
    return chatFlow(input);
}
