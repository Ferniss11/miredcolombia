// src/lib/chat/application/get-all-chat-sessions.use-case.ts
import type { ChatSession } from '../domain/chat-session.entity';
import type { ChatRepository } from '../domain/chat.repository';

/**
 * Use case for retrieving all chat sessions.
 * This is typically used for admin panels or analytics.
 */
export class GetAllChatSessionsUseCase {
  constructor(private readonly chatRepository: ChatRepository) {}

  async execute(): Promise<ChatSession[]> {
    return this.chatRepository.findAllSessions();
  }
}
