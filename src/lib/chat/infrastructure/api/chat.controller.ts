// src/lib/chat/infrastructure/api/chat.controller.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiResponse } from '@/lib/platform/api/api-response';
import { FirestoreChatRepository } from '../persistence/firestore-chat.repository';
import { GenkitAgentAdapter } from '../ai/genkit-agent.adapter';
import { StartChatSessionUseCase } from '../../application/start-chat-session.use-case';
import { PostMessageUseCase } from '../../application/post-message.use-case';
import { GetChatHistoryUseCase } from '../../application/get-chat-history.use-case';
import { FindSessionByPhoneUseCase } from '../../application/find-session-by-phone.use-case';
import { StartOrResumeChatUseCase } from '../../application/start-or-resume-chat.use-case';

// --- Input Validation Schemas ---
const StartSessionSchema = z.object({
  userName: z.string().min(2),
  userPhone: z.string().min(7),
  userEmail: z.string().email().optional().or(z.literal('')),
  businessId: z.string().optional(),
});

const PostMessageSchema = z.object({
  userMessage: z.string().min(1),
  businessId: z.string().optional(),
});


export class ChatController {
  private startOrResumeChatUseCase: StartOrResumeChatUseCase;
  private postMessageUseCase: PostMessageUseCase;
  
  constructor() {
    const chatRepository = new FirestoreChatRepository();
    const agentAdapter = new GenkitAgentAdapter();
    
    // Instantiate all necessary use cases
    const startChatSessionUseCase = new StartChatSessionUseCase(chatRepository);
    const findSessionByPhoneUseCase = new FindSessionByPhoneUseCase(chatRepository);
    const getChatHistoryUseCase = new GetChatHistoryUseCase(chatRepository);

    // Main use cases for the controller
    this.startOrResumeChatUseCase = new StartOrResumeChatUseCase(
        startChatSessionUseCase,
        findSessionByPhoneUseCase,
        getChatHistoryUseCase
    );
    this.postMessageUseCase = new PostMessageUseCase(chatRepository, agentAdapter);
  }

  /**
   * Handles starting a new chat session or resuming an existing one.
   * Linked to POST /api/chat/sessions
   */
  async startSession(req: NextRequest): Promise<ApiResponse> {
    const json = await req.json();
    const input = StartSessionSchema.parse(json);

    const { session, history, isResumed } = await this.startOrResumeChatUseCase.execute(input);

    return ApiResponse.success({
        sessionId: session.id,
        history: history.map(m => ({ ...m, timestamp: m.timestamp.toISOString() })),
        isResumed,
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
    // This is now handled by a dedicated use case.
    const getChatHistoryUseCase = new GetChatHistoryUseCase(new FirestoreChatRepository());
    const chatHistory = await getChatHistoryUseCase.execute({ sessionId });

    const output = await this.postMessageUseCase.execute({
      sessionId,
      userMessage,
      chatHistory,
      businessId,
    });

    return ApiResponse.success(output);
  }
}
