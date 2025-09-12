
// src/lib/chat/infrastructure/api/agent-lab.controller.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiResponse } from '@/lib/platform/api/api-response';
import { FirestoreChatRepository } from '../persistence/firestore-chat.repository';
import { GenkitAgentAdapter } from '../ai/genkit-agent.adapter';
import { SimulateAgentResponseUseCase } from '../../application/simulate-agent-response.use-case';
import { ChatMessageSchema } from '@/lib/chat-types';

const SimulateChatSchema = z.object({
  agentId: z.enum(['global', 'valeria_premium', 'business']),
  currentMessage: z.string().min(1),
  chatHistory: z.array(ChatMessageSchema),
  businessId: z.string().optional(),
});


export class AgentLabController {
  private simulateAgentResponseUseCase: SimulateAgentResponseUseCase;

  constructor() {
    // For simulation, we don't need a repository, just the agent adapter.
    const agentAdapter = new GenkitAgentAdapter();
    this.simulateAgentResponseUseCase = new SimulateAgentResponseUseCase(agentAdapter);
  }

  async simulateChat(req: NextRequest): Promise<ApiResponse> {
    const json = await req.json();
    const input = SimulateChatSchema.parse(json);

    const output = await this.simulateAgentResponseUseCase.execute({
      agentId: input.agentId,
      chatHistory: input.chatHistory,
      currentMessage: input.currentMessage,
      businessId: input.businessId,
    });

    return ApiResponse.success({ response: output });
  }
}
