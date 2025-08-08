// src/lib/chat/application/start-chat-session.use-case.ts
import type { ChatSession } from '../domain/chat-session.entity';
import type { ChatRepository } from '../domain/chat.repository';

export type StartChatSessionInput = {
  userName: string;
  userPhone: string;
  userEmail?: string;
  businessId?: string; // Optional context for business-specific chats
};

export type StartChatSessionOutput = {
  session: ChatSession;
  welcomeMessage: string;
};

/**
 * Use case for starting a new chat session.
 * It creates the session and generates an initial welcome message.
 */
export class StartChatSessionUseCase {
  constructor(private readonly chatRepository: ChatRepository) {}

  async execute(input: StartChatSessionInput): Promise<StartChatSessionOutput> {
    const sessionData: Omit<ChatSession, 'id'> = {
      ...input,
      createdAt: new Date(),
      totalTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
    };
    
    const session = await this.chatRepository.createSession(sessionData);
    
    const welcomeMessage = `¡Hola, ${input.userName}! Soy tu asistente virtual. ¿Cómo puedo ayudarte hoy?`;
    
    // Persist the initial welcome message
    await this.chatRepository.saveMessage({
      sessionId: session.id,
      text: welcomeMessage,
      role: 'model',
      timestamp: new Date(),
    });

    return { session, welcomeMessage };
  }
}
