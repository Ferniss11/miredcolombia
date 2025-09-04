// src/lib/chat/application/start-or-resume-chat.use-case.ts
import type { ChatSession } from '../domain/chat-session.entity';
import type { ChatMessage } from '../domain/chat-message.entity';
import type { FindSessionByPhoneUseCase } from './find-session-by-phone.use-case';
import type { GetChatHistoryUseCase } from './get-chat-history.use-case';
import type { StartChatSessionUseCase, StartChatSessionInput } from './start-chat-session.use-case';
import type { UserRepository } from '@/lib/user/domain/user.repository';
import type { GetSessionByIdUseCase } from './get-session-by-id.use-case';


export type StartOrResumeChatOutput = {
  session: ChatSession;
  history: ChatMessage[];
  isResumed: boolean;
};

/**
 * Orchestrates the logic for starting a new chat or resuming an existing one
 * based on the user's phone number or UID. This is the primary entry point for chat initiation.
 */
export class StartOrResumeChatUseCase {
  constructor(
    private readonly startChatSessionUseCase: StartChatSessionUseCase,
    private readonly findSessionByPhoneUseCase: FindSessionByPhoneUseCase,
    private readonly getChatHistoryUseCase: GetChatHistoryUseCase,
    private readonly userRepository: UserRepository,
    private readonly getSessionByIdUseCase: GetSessionByIdUseCase,

  ) {}

  async execute(input: StartChatSessionInput & { userId?: string }): Promise<StartOrResumeChatOutput> {
    // Priority 1: If a user ID is provided, try to find their linked session first.
    if (input.userId) {
        const userProfile = await this.userRepository.findByUid(input.userId);
        const premiumSessionId = userProfile?.valeriaProfile?.sessionId;
        
        if (premiumSessionId) {
            const premiumSession = await this.getSessionByIdUseCase.execute({ sessionId: premiumSessionId });
            if (premiumSession) {
                 const history = await this.getChatHistoryUseCase.execute({ sessionId: premiumSession.id });
                 return { session: premiumSession, history, isResumed: true };
            }
        }
    }


    // Priority 2: Find session by phone number for guests or users without a linked session.
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
      
      // If a logged-in user starts their first session, link it to their profile.
      if (input.userId) {
          await this.userRepository.update(input.userId, { 
              valeriaProfile: { sessionId: session.id } as any 
          });
      }
      
      return {
        session,
        history,
        isResumed: false,
      };
    }
  }
}
