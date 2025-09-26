// This file is no longer used by the main StartOrResumeChatUseCase
// for the guest flow, but is kept in case we want to re-introduce
// session resumption for guests based on phone numbers in the future.
// It can be considered for deletion in a later cleanup.

import type { ChatSession } from '../domain/chat-session.entity';
import type { ChatRepository } from '../domain/chat.repository';

export type FindSessionByPhoneInput = {
    phone: string;
    businessId?: string;
}

/**
 * Use case for finding an existing chat session by a user's phone number.
 */
export class FindSessionByPhoneUseCase {
  constructor(private readonly chatRepository: ChatRepository) {}

  async execute({ phone, businessId }: FindSessionByPhoneInput): Promise<ChatSession | null> {
    return this.chatRepository.findSessionByPhone(phone, businessId);
  }
}
