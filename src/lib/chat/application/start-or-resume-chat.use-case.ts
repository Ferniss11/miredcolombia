// src/lib/chat/application/start-or-resume-chat.use-case.ts
import type { ChatSession } from '../domain/chat-session.entity';
import type { ChatMessage } from '../domain/chat-message.entity';
import type { GetChatHistoryUseCase } from './get-chat-history.use-case';
import type { StartChatSessionUseCase, StartChatSessionInput } from './start-chat-session.use-case';
import type { UserRepository } from '@/lib/user/domain/user.repository';
import type { GetSessionByIdUseCase } from './get-session-by-id.use-case';


export type StartOrResumeChatOutput = {
  session: ChatSession;
  history: ChatMessage[];
};

/**
 * Orchestrates the logic for starting a new chat or resuming an existing one
 * based on the user's phone number or UID. This is the primary entry point for chat initiation.
 */
export class StartOrResumeChatUseCase {
  constructor(
    private readonly startChatSessionUseCase: StartChatSessionUseCase,
    private readonly getChatHistoryUseCase: GetChatHistoryUseCase,
    private readonly userRepository: UserRepository,
    private readonly getSessionByIdUseCase: GetSessionByIdUseCase,

  ) {}

  async execute(input: StartChatSessionInput & { userId?: string }): Promise<StartOrResumeChatOutput> {
    // Priority 1: If a user ID is provided, this is a logged-in user.
    if (input.userId) {
        const userProfile = await this.userRepository.findByUid(input.userId);
        
        let sessionIdToResume: string | undefined = undefined;
        // Business chat has priority
        if (input.businessId && userProfile?.businessProfile?.placeId === input.businessId) {
            // How do we get the business chat session id? Needs to be stored somewhere.
            // For now, let's assume it's not implemented and we create a new one.
        }
        // Then check for a global premium session
        if (!sessionIdToResume) {
            sessionIdToResume = userProfile?.valeriaProfile?.sessionId;
        }
        
        if (sessionIdToResume) {
            const session = await this.getSessionByIdUseCase.execute({ sessionId: sessionIdToResume });
            if (session) {
                 const history = await this.getChatHistoryUseCase.execute({ sessionId: session.id });
                 return { session, history };
            }
        }
        
        // If no existing session is found, create a new one for the logged-in user
        const { session, history } = await this.startChatSessionUseCase.execute(input);
        
        // If it's a global chat, link the new session to their profile.
        if (!input.businessId) {
             await this.userRepository.update(input.userId, { 
                valeriaProfile: { ...userProfile?.valeriaProfile, sessionId: session.id } as any 
            });
        }
        
        return { session, history };
    }

    // Guest user flow: For now, always start a new session for guests.
    // A more complex implementation could try to find sessions by phone/email.
    const { session, history } = await this.startChatSessionUseCase.execute(input);
    return { session, history };
  }
}
