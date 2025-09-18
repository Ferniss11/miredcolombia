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
import { GetAllChatSessionsUseCase } from '../../application/get-all-chat-sessions.use-case';
import { GetSessionByIdUseCase } from '../../application/get-session-by-id.use-case';
import { FirestoreUserRepository } from '@/lib/user/infrastructure/persistence/firestore-user.repository';
import { adminAuth } from '@/lib/firebase/admin-config';

// --- Input Validation Schemas ---
const StartSessionSchema = z.object({
  userName: z.string().min(2),
  userPhone: z.string().optional(),
  userEmail: z.string().email().optional().or(z.literal('')),
  businessId: z.string().optional(),
  userId: z.string().optional(), // Added userId for logged-in users
});

export class ChatController {
  private startOrResumeChatUseCase: StartOrResumeChatUseCase;
  private postMessageUseCase: PostMessageUseCase;
  private getAllSessionsUseCase: GetAllChatSessionsUseCase;
  private getSessionByIdUseCase: GetSessionByIdUseCase;
  private getChatHistoryUseCase: GetChatHistoryUseCase;
  
  constructor() {
    const chatRepository = new FirestoreChatRepository();
    const agentAdapter = new GenkitAgentAdapter();
    const userRepository = new FirestoreUserRepository();
    
    // Instantiate all necessary use cases
    const startChatSessionUseCase = new StartChatSessionUseCase(chatRepository);
    const findSessionByPhoneUseCase = new FindSessionByPhoneUseCase(chatRepository);
    
    // Use cases that will be called directly by the controller methods
    this.getChatHistoryUseCase = new GetChatHistoryUseCase(chatRepository);
    this.getSessionByIdUseCase = new GetSessionByIdUseCase(chatRepository);

    // Main use cases for the controller
    this.startOrResumeChatUseCase = new StartOrResumeChatUseCase(
        startChatSessionUseCase,
        findSessionByPhoneUseCase,
        this.getChatHistoryUseCase,
        userRepository,
        this.getSessionByIdUseCase
    );
    this.postMessageUseCase = new PostMessageUseCase(chatRepository, agentAdapter);
    this.getAllSessionsUseCase = new GetAllChatSessionsUseCase(chatRepository);
  }

  /**
   * Handles starting a new chat session or resuming an existing one.
   * Linked to POST /api/chat/sessions
   */
  async startSession(req: NextRequest): Promise<ApiResponse> {
    const json = await req.json();
    const input = StartSessionSchema.parse(json);

    const { session, history } = await this.startOrResumeChatUseCase.execute(input);

    return ApiResponse.success({
        session: { ...session, createdAt: session.createdAt.toISOString() },
        history: history.map(m => ({ ...m, timestamp: m.timestamp.toISOString() })),
    });
  }
  
  /**
   * Handles posting a new message to a session.
   * Linked to POST /api/chat/sessions/[sessionId]/messages
   */
  async postMessage(req: NextRequest, { params }: { params: { sessionId: string } }): Promise<ApiResponse> {
    const { sessionId } = params;

    let userId: string | undefined = undefined;
    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (idToken && adminAuth) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        userId = decodedToken.uid;
      } catch (error) {
        console.log("Could not verify token for message posting (guest user).");
      }
    }
    
    const contentType = req.headers.get('content-type');
    let userMessage: string;
    let documentText: string | undefined = undefined;

    if (contentType?.includes('multipart/form-data')) {
        const formData = await req.formData();
        userMessage = formData.get('userMessage') as string;
        const file = formData.get('document') as File | null;
        if (file) {
            const pdf = (await import('pdf-parse')).default;
            const buffer = Buffer.from(await file.arrayBuffer());
            const data = await pdf(buffer);
            documentText = data.text;
        }
    } else {
        const json = await req.json();
        userMessage = json.userMessage;
    }

    const businessId = new URL(req.url).searchParams.get('businessId') || undefined;

    const output = await this.postMessageUseCase.execute({
      sessionId,
      userMessage,
      userId,
      businessId,
      documentText,
    });

    return ApiResponse.success(output);
  }


  /**
   * Handles retrieving all chat sessions for the admin panel.
   * Linked to GET /api/chat/sessions
   */
  async getAllSessions(req: NextRequest): Promise<ApiResponse> {
    const sessions = await this.getAllSessionsUseCase.execute();
    return ApiResponse.success(sessions.map(s => ({ ...s, createdAt: s.createdAt.toISOString() })));
  }

  /**
   * Handles retrieving a single chat session with its full message history.
   * Linked to GET /api/chat/sessions/[sessionId]
   */
  async getSessionDetails(req: NextRequest, { params }: { params: { sessionId: string } }): Promise<ApiResponse> {
      const { sessionId } = params;
      const businessId = req.nextUrl.searchParams.get('businessId') || undefined;

      const session = await this.getSessionByIdUseCase.execute({ sessionId, businessId });
      if (!session) {
          return ApiResponse.notFound('Chat session not found.');
      }

      const messages = await this.getChatHistoryUseCase.execute({ sessionId, businessId });

      return ApiResponse.success({
          session: { ...session, createdAt: session.createdAt.toISOString() },
          messages: messages.map(m => ({ ...m, timestamp: m.timestamp.toISOString() })),
      });
  }
}
