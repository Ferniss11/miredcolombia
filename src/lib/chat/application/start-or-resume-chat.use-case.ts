// src/lib/chat/application/start-or-resume-chat.use-case.ts
import type { ChatSession } from '../domain/chat-session.entity';
import type { ChatMessage } from '../domain/chat-message.entity';
import type { FindSessionByPhoneUseCase } from './find-session-by-phone.use-case';
import type { GetChatHistoryUseCase } from './get-chat-history.use-case';
import type { StartChatSessionUseCase, StartChatSessionInput } from './start-chat-session.use-case';

export type StartOrResumeChatOutput = {
  session: ChatSession;
  history: ChatMessage[];
  isResumed: boolean;
};

/**
 * Orchestrates the logic for starting a new chat or resuming an existing one
 * based on the user's phone number. This is the primary entry point for chat initiation.
 */
export class StartOrResumeChatUseCase {
  constructor(
    private readonly startChatSessionUseCase: StartChatSessionUseCase,
    private readonly findSessionByPhoneUseCase: FindSessionByPhoneUseCase,
    private readonly getChatHistoryUseCase: GetChatHistoryUseCase
  ) {}

  async execute(input: StartChatSessionInput): Promise<StartOrResumeChatOutput> {
    const existingSession = await this.findSessionByPhoneUseCase.execute({
        phone: input.userPhone,
        businessId: input.businessId,
    });

    if (existingSession) {
      // Logic for user verification (e.g., SMS) will be added here in a future step.
      // For now, we simply resume the session.
      const history = await this.getChatHistoryUseCase.execute({ 
          sessionId: existingSession.id,
          businessId: input.businessId,
      });
      return {
        session: existingSession,
        history,
        isResumed: true,
      };
    } else {
      // If no session exists, create a new one, ensuring the businessId is passed along.
      const { session, history } = await this.startChatSessionUseCase.execute(input);
      return {
        session,
        history,
        isResumed: false,
      };
    }
  }
}
