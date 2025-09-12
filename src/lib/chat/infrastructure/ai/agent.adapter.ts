
// src/lib/chat/infrastructure/ai/agent.adapter.ts
import type { ChatMessage } from '../../domain/chat-message.entity';
import type { TokenUsage } from '@/lib/chat-types';

/**
 * Defines the contract (port) for an AI agent adapter.
 * This allows the application layer to be independent of the specific AI
 * implementation (e.g., Genkit, LangChain, etc.).
 */
export interface AgentAdapter {
  getCompletion(input: {
    chatHistory: ChatMessage[];
    currentMessage: string;
    businessId?: string; // Context to decide which agent to use
    agentId?: 'global' | 'valeria_premium' | 'business'; // For explicit agent selection in labs
    documentText?: string; // For document analysis feature
  }): Promise<{ response: string; usage: TokenUsage, cost: number }>;
}
