// src/lib/chat/infrastructure/api/chat.controller.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiResponse } from '@/lib/platform/api/api-response';
import { FirestoreChatRepository } from '../persistence/firestore-chat.repository';
import { GenkitAgentAdapter } from '../ai/genkit-agent.adapter';
import { StartChatSessionUseCase } from '../../application/start-chat-session.use-case';
import { PostMessageUseCase } from '../../application/post-message.use-case';
import { GetChatHistoryUseCase } from '../../application/get-chat-history.use-case';
import { GetAllChatSessionsUseCase } from '../../application/get-all-chat-sessions.use-case';
import { findSessionByPhone } from '@/services/chat.service';

// --- Input Validation Schemas ---
const StartSessionSchema = z.object({
  userName: z.string().min(2),
  userPhone: z.string().min(7),
  userEmail: z.string().email().optional(),
  businessId: z.string().optional(),
});

const PostMessageSchema = z.object({
  userMessage: z.string().min(1),
  businessId: z.string().optional(),
});


export class ChatController {
  private startChatSessionUseCase: StartChatSessionUseCase;
  private postMessageUseCase: PostMessageUseCase;
  private getChatHistoryUseCase: GetChatHistoryUseCase;
  private getAllChatSessionsUseCase: GetAllChatSessionsUseCase;

  constructor() {
    const chatRepository = new FirestoreChatRepository();
    const agentAdapter = new GenkitAgentAdapter();
    
    this.startChatSessionUseCase = new StartChatSessionUseCase(chatRepository);
    this.postMessageUseCase = new PostMessageUseCase(chatRepository, agentAdapter);
    this.getChatHistoryUseCase = new GetChatHistoryUseCase(chatRepository);
    // This use case might need the repository if we decide to implement it fully.
    // For now, it's not used in this controller but is set up for future use.
    this.getAllChatSessionsUseCase = new GetAllChatSessionsUseCase(chatRepository); 
  }

  /**
   * Handles starting a new chat session or resuming an existing one.
   * Linked to POST /api/chat/sessions
   */
  async startSession(req: NextRequest): Promise<ApiResponse> {
    const json = await req.json();
    const input = StartSessionSchema.parse(json);

    const existingSession = await findSessionByPhone(input.userPhone);
    
    if (existingSession) {
        const history = await this.getChatHistoryUseCase.execute({ sessionId: existingSession.id });
        return ApiResponse.success({ 
            sessionId: existingSession.id, 
            history: history.map(m => ({...m, timestamp: m.timestamp.toISOString()})),
            isResumed: true,
        });
    }

    const { session, history } = await this.startChatSessionUseCase.execute(input);
    
    return ApiResponse.created({ 
        sessionId: session.id,
        history: history.map(m => ({...m, timestamp: m.timestamp.toISOString()})),
        isResumed: false,
    });
  }
  
  /**
   * Handles posting a new message to a session.
   * Linked to POST /api/chat/sessions/[sessionId]/messages
   */
  async postMessage(req: NextRequest, { params }: { params: { sessionId: string } }): Promise<ApiResponse> {
    const { sessionId } = params;
    const json = await req.json();
    const { userMessage, businessId } = PostMessageSchema.parse(json);

    // We need the history to pass to the agent.
    const chatHistory = await this.getChatHistoryUseCase.execute({ sessionId });

    const output = await this.postMessageUseCase.execute({
      sessionId,
      userMessage,
      chatHistory,
      businessId,
    });

    return ApiResponse.success(output);
  }
}
