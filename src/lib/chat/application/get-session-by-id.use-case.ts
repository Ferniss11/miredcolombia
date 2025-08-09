// src/lib/chat/application/get-session-by-id.use-case.ts
import type { ChatSession } from '../domain/chat-session.entity';
import type { ChatRepository } from '../domain/chat.repository';

export type GetSessionByIdInput = {
  sessionId: string;
  businessId?: string; // Optional context
};

/**
 * Use case for retrieving a single chat session by its ID.
 */
export class GetSessionByIdUseCase {
  constructor(private readonly chatRepository: ChatRepository) {}

  async execute({ sessionId, businessId }: GetSessionByIdInput): Promise<ChatSession | null> {
    return this.chatRepository.findSessionById(sessionId, businessId);
  }
}
