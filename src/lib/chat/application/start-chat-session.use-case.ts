// src/lib/chat/application/start-chat-session.use-case.ts
import type { ChatSession } from '../domain/chat-session.entity';
import type { ChatRepository } from '../domain/chat.repository';
import type { ChatMessage } from '../domain/chat-message.entity';

export type StartChatSessionInput = {
  userName: string;
  userPhone: string;
  userEmail?: string;
  businessId?: string; // Optional context for business-specific chats
};

export type StartChatSessionOutput = {
  session: ChatSession;
  history: ChatMessage[];
};

/**
 * Use case for starting a new chat session.
 * It creates the session and the initial welcome message atomically.
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
    
    const welcomeMessageText = `¡Hola, ${input.userName}! Soy tu asistente virtual. ¿Cómo puedo ayudarte hoy?`;
    
    const { session, message } = await this.chatRepository.createSessionWithInitialMessage(
      sessionData,
      welcomeMessageText
    );

    return { session, history: [message] };
  }
}
