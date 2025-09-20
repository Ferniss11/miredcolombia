// src/lib/chat/infrastructure/ai/agent.adapter.ts

import type { ChatMessage, TokenUsage } from '@/lib/chat-types';

/**
 * Defines the contract (port) for an AI agent adapter.
 * This decouples the application's use cases from any specific AI implementation
 * (e.g., Genkit, LangChain, etc.).
 */
export interface AgentAdapter {
  /**
   * Generates a completion from an AI agent based on the conversation history and a new message.
   * @param input - The context for the AI completion.
   * @returns A promise that resolves with the AI's response text and token usage details.
   */
  getCompletion(input: {
    chatHistory: Omit<ChatMessage, 'id' | 'timestamp'>[]; // History can be simpler for the AI
    currentMessage: string;
    businessId?: string;
    sessionId?: string; // Add sessionId to the interface
    // New optional field to explicitly specify an agent, used by the Agent Lab
    agentId?: 'global' | 'valeria_premium' | 'business';
  }): Promise<{ response: string; usage: TokenUsage; cost: number; }>;
}
