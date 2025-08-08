// src/lib/chat/application/find-session-by-phone.use-case.ts
import type { ChatSession } from '../domain/chat-session.entity';
import type { ChatRepository } from '../domain/chat.repository';

/**
 * Use case for finding an existing chat session by a user's phone number.
 */
export class FindSessionByPhoneUseCase {
  constructor(private readonly chatRepository: ChatRepository) {}

  async execute(phone: string): Promise<ChatSession | null> {
    return this.chatRepository.findSessionByPhone(phone);
  }
}
