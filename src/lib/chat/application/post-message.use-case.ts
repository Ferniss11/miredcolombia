// src/lib/chat/application/post-message.use-case.ts
import type { ChatMessage, ChatMessageRole } from '../domain/chat-message.entity';
import type { ChatRepository } from '../domain/chat.repository';
// The AgentAdapter is an abstraction over the AI implementation (e.g., Genkit)
// We will create this adapter in the infrastructure layer later.
import type { AgentAdapter } from '../infrastructure/ai/agent.adapter';
import type { TokenUsage } from '@/lib/chat-types';

export type PostMessageInput = {
  sessionId: string;
  userMessage: string;
  chatHistory: ChatMessage[];
  businessId?: string; // Optional context for business-specific agents
};

export type PostMessageOutput = {
  aiResponse: string;
  usage: TokenUsage;
};

/**
 * Use case for handling the process of a user posting a message
 * and getting a response from an AI agent.
 */
export class PostMessageUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly agentAdapter: AgentAdapter
  ) {}

  async execute({ sessionId, userMessage, chatHistory, businessId }: PostMessageInput): Promise<PostMessageOutput> {
    // 1. Persist the user's message
    const userMsgEntity: Omit<ChatMessage, 'id'> = {
      sessionId,
      text: userMessage,
      role: 'user',
      timestamp: new Date(),
    };
    await this.chatRepository.saveMessage(userMsgEntity);
    
    // 2. Invoke the AI agent via the adapter to get a response
    const { response, usage, cost } = await this.agentAdapter.getCompletion({
        chatHistory,
        currentMessage: userMessage,
        businessId
    });

    // 3. Persist the AI's response
    const aiMsgEntity: Omit<ChatMessage, 'id'> = {
      sessionId,
      text: response,
      role: 'model',
      timestamp: new Date(),
      usage,
      cost,
    };
    await this.chatRepository.saveMessage(aiMsgEntity);
    
    return { aiResponse: response, usage };
  }
}
