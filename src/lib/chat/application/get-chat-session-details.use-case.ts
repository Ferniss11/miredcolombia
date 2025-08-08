// src/lib/chat/application/get-chat-session-details.use-case.ts
import type { ChatSession } from '../domain/chat-session.entity';
import type { ChatMessage } from '../domain/chat-message.entity';
import type { GetSessionByIdUseCase, GetSessionByIdInput } from './get-session-by-id.use-case';
import type { GetChatHistoryUseCase } from './get-chat-history.use-case';

type GetChatSessionDetailsOutput = {
  session: ChatSession;
  messages: ChatMessage[];
};

/**
 * Use case to get all details of a chat session, including the session
 * metadata and the full message history.
 */
export class GetChatSessionDetailsUseCase {
  constructor(
    private readonly getSessionByIdUseCase: GetSessionByIdUseCase,
    private readonly getChatHistoryUseCase: GetChatHistoryUseCase
  ) {}

  async execute(input: GetSessionByIdInput): Promise<GetChatSessionDetailsOutput | null> {
    const session = await this.getSessionByIdUseCase.execute(input);

    if (!session) {
      return null;
    }

    const messages = await this.getChatHistoryUseCase.execute(input);

    return { session, messages };
  }
}
