// src/lib/chat/application/simulate-agent-response.use-case.ts
import type { ChatMessage, TokenUsage } from '@/lib/chat-types';
import type { AgentAdapter } from '../infrastructure/ai/agent.adapter';

export type SimulateAgentInput = {
  agentId: 'global' | 'valeria_premium' | 'business';
  chatHistory: ChatMessage[];
  currentMessage: string;
  businessId?: string; // For business agent simulation
  documentText?: string; // For premium agent document analysis
};

export type SimulateAgentOutput = {
  response: string;
  usage: TokenUsage;
};

/**
 * Use case specifically for the Agent Lab.
 * It bypasses user-based logic and directly invokes an agent by its ID.
 */
export class SimulateAgentResponseUseCase {
  constructor(private readonly agentAdapter: AgentAdapter) {}

  async execute(input: SimulateAgentInput): Promise<SimulateAgentOutput> {
    
    const { response, usage, cost } = await this.agentAdapter.getCompletion({
        chatHistory: input.chatHistory,
        currentMessage: input.currentMessage,
        businessId: input.agentId === 'business' ? input.businessId : undefined,
        agentId: input.agentId,
        documentText: input.documentText, // Pass document text to the adapter
    });
    
    return { response, usage };
  }
}
