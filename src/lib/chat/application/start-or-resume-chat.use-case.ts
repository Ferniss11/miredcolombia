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
    // Priority 1: If a user ID is provided, this is a logged-in user.
    if (input.userId) {
        const userProfile = await this.userRepository.findByUid(input.userId);
        const premiumSessionId = userProfile?.valeriaProfile?.sessionId;
        
        // If the user has a session ID linked to their profile, resume it.
        if (premiumSessionId) {
            const premiumSession = await this.getSessionByIdUseCase.execute({ sessionId: premiumSessionId });
            if (premiumSession) {
                 const history = await this.getChatHistoryUseCase.execute({ sessionId: premiumSession.id });
                 return { session: premiumSession, history, isResumed: true };
            }
        }
        
        // If the logged-in user has no session, create a new one for them.
        const { session, history } = await this.startChatSessionUseCase.execute(input);
        
        // Link the new session to their profile so we can find it next time.
        await this.userRepository.update(input.userId, { 
            valeriaProfile: { ...userProfile?.valeriaProfile, sessionId: session.id } as any 
        });
        
        return { session, history, isResumed: false };
    }

    // Priority 2: If no user ID, this is a guest. Find session by phone number.
    const existingSession = await this.findSessionByPhoneUseCase.execute({
        phone: input.userPhone,
        businessId: input.businessId,
    });

    if (existingSession) {
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
      // If no session exists for a guest, create a new one.
      const { session, history } = await this.startChatSessionUseCase.execute(input);
      return {
        session,
        history,
        isResumed: false,
      };
    }
  }
}
