// src/lib/chat/application/get-chat-history.use-case.ts
import type { ChatMessage } from '../domain/chat-message.entity';
import type { ChatRepository } from '../domain/chat.repository';

export type GetChatHistoryInput = {
  sessionId: string;
};

/**
 * Use case for retrieving the message history of a specific chat session.
 */
export class GetChatHistoryUseCase {
  constructor(private readonly chatRepository: ChatRepository) {}

  async execute({ sessionId }: GetChatHistoryInput): Promise<ChatMessage[]> {
    return this.chatRepository.getHistory(sessionId);
  }
}
