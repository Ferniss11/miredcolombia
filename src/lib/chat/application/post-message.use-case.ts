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
  userId?: string;
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

  async execute({ sessionId, userMessage, userId, businessId }: PostMessageInput): Promise<PostMessageOutput> {
    
    // 1. Get the conversation history. This must be done first.
    const chatHistory = await this.chatRepository.getHistory(sessionId, businessId);

    // 2. Persist the user's message
    const userMsgEntity: Omit<ChatMessage, 'id' | 'timestamp'> = {
      sessionId,
      businessId,
      text: userMessage,
      role: 'user',
      authorId: userId,
    };
    await this.chatRepository.saveMessage(userMsgEntity);

    // Create a new history array that includes the newly saved user message for the AI
    const updatedChatHistory = [...chatHistory, userMsgEntity as ChatMessage];
    
    // 3. Invoke the AI agent via the adapter to get a response
    const { response, usage, cost } = await this.agentAdapter.getCompletion({
        chatHistory: updatedChatHistory, // Pass the most up-to-date history
        currentMessage: userMessage,
        businessId,
        sessionId: sessionId,
    });

    // 4. Persist the AI's response
    const aiMsgEntity: Omit<ChatMessage, 'id' | 'timestamp'> = {
      sessionId,
      businessId,
      text: response,
      role: 'model',
      usage,
      cost,
    };
    await this.chatRepository.saveMessage(aiMsgEntity);
    
    return { aiResponse: response, usage };
  }
}
