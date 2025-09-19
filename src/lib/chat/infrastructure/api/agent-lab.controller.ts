// src/lib/chat/infrastructure/api/agent-lab.controller.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiResponse } from '@/lib/platform/api/api-response';
import { GenkitAgentAdapter } from '../ai/genkit-agent.adapter';
import { SimulateAgentResponseUseCase } from '../../application/simulate-agent-response.use-case';
import { ChatMessageSchema } from '@/lib/chat-types';
import pdf from 'pdf-parse';

// The schema is no longer needed as we are processing FormData directly.

export class AgentLabController {
  private simulateAgentResponseUseCase: SimulateAgentResponseUseCase;

  constructor() {
    const agentAdapter = new GenkitAgentAdapter();
    this.simulateAgentResponseUseCase = new SimulateAgentResponseUseCase(agentAdapter);
  }

  async simulateChat(req: NextRequest): Promise<ApiResponse> {
    const formData = await req.formData();
    
    const agentId = formData.get('agentId') as 'global' | 'valeria_premium' | 'business';
    const currentMessage = formData.get('currentMessage') as string;
    const chatHistory = JSON.parse(formData.get('chatHistory') as string);
    const businessId = formData.get('businessId') as string | undefined;
    const contextFile = formData.get('contextFile') as File | null;
    
    let documentText: string | undefined = undefined;

    if (contextFile) {
        try {
            const buffer = Buffer.from(await contextFile.arrayBuffer());
            const data = await pdf(buffer);
            documentText = data.text.replace(/\s+/g, ' ').trim(); // Normalize whitespace
        } catch(error) {
            console.error("Error parsing PDF in AgentLabController:", error);
            return ApiResponse.badRequest('Failed to parse the uploaded PDF file.');
        }
    }

    const output = await this.simulateAgentResponseUseCase.execute({
      agentId,
      chatHistory,
      currentMessage,
      businessId,
      documentText,
    });
    
    // The use case now returns { response, usage }. We only need to return the response text.
    return ApiResponse.success({ response: output.response });
  }
}
