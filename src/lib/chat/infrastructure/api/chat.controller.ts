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
import { GetSessionByIdUseCase } from '../../application/get-session-by-id.use-case';
import { FirestoreUserRepository } from '@/lib/user/infrastructure/persistence/firestore-user.repository';
import { adminAuth } from '@/lib/firebase/admin-config';
import { StartOrResumeChatUseCase } from '../../application/start-or-resume-chat.use-case';

// --- Input Validation Schemas ---
const StartSessionSchema = z.object({
  userName: z.string().min(2),
  userPhone: z.string().optional(),
  userEmail: z.string().email().optional().or(z.literal('')),
  businessId: z.string().optional(),
  userId: z.string().optional(),
});

export type PostMessagePayload = {
    userMessage: string;
    userId?: string;
    sessionId: string;
    businessId?: string;
    document?: File | null;
    agentId?: 'global' | 'valeria_premium' | 'business';
};


export class ChatController {
  private startOrResumeChatUseCase: StartOrResumeChatUseCase;
  private postMessageUseCase: PostMessageUseCase;
  private getAllSessionsUseCase: GetAllChatSessionsUseCase;
  private getSessionByIdUseCase: GetSessionByIdUseCase;
  private getChatHistoryUseCase: GetChatHistoryUseCase;
  private chatRepository: FirestoreChatRepository;
  
  constructor() {
    this.chatRepository = new FirestoreChatRepository();
    const agentAdapter = new GenkitAgentAdapter();
    const userRepository = new FirestoreUserRepository();
    
    const startChatSessionUseCase = new StartChatSessionUseCase(this.chatRepository);
    this.getChatHistoryUseCase = new GetChatHistoryUseCase(this.chatRepository);
    this.getSessionByIdUseCase = new GetSessionByIdUseCase(this.chatRepository);
    this.startOrResumeChatUseCase = new StartOrResumeChatUseCase(
        startChatSessionUseCase,
        this.getChatHistoryUseCase,
        userRepository,
        this.getSessionByIdUseCase
    );
    this.postMessageUseCase = new PostMessageUseCase(this.chatRepository, agentAdapter);
    this.getAllSessionsUseCase = new GetAllChatSessionsUseCase(this.chatRepository);
  }

  async startSession(req: NextRequest): Promise<ApiResponse> {
    const json = await req.json();
    const input = StartSessionSchema.parse(json);

    // This logic is simplified; in a real app, you might have different use cases
    // for guest vs. authenticated user session starts.
    const { session, history } = await this.startOrResumeChatUseCase.execute(input);

    return ApiResponse.success({
        session: { ...session, createdAt: session.createdAt.toISOString() },
        history: history.map(m => ({ ...m, timestamp: m.timestamp.toISOString() })),
    });
  }
  
  async postMessage(req: NextRequest, { params }: { params: { sessionId: string } }): Promise<ApiResponse> {
      let userMessage: string;
      let document: File | null = null;
      let userId: string | undefined = undefined;

      const { sessionId } = params;
      const { searchParams } = new URL(req.url);
      const businessId = searchParams.get('businessId') || undefined;
      const agentId = searchParams.get('agentId') as any;

      if (!sessionId) {
          return ApiResponse.badRequest('Session ID is missing.');
      }
      
      const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
      if (idToken && adminAuth) {
        try {
          const decodedToken = await adminAuth.verifyIdToken(idToken);
          userId = decodedToken.uid;
        } catch (error) { /* Ignore for guests */ }
      }

      const contentType = req.headers.get('content-type');
      if (contentType?.includes('multipart/form-data')) {
          const formData = await req.formData();
          userMessage = formData.get('currentMessage') as string;
          document = formData.get('document') as File | null;
      } else {
          const json = await req.json();
          userMessage = json.userMessage;
      }
      
      // We don't need to handle document ingestion here as it's not part of this use case.
      // A more complex setup would have a separate use case for this.
      if (document) {
          // Placeholder for document ingestion logic
          console.log(`Received document: ${document.name} for session ${sessionId}`);
          if (!userMessage) {
              userMessage = `He adjuntado el documento "${document.name}". Por favor, resúmelo.`;
          }
      }

      const { lastResponse } = await this.postMessageUseCase.execute({
          sessionId,
          userMessage,
          userId,
          businessId,
          agentId
      });

      // After posting, always fetch the full, updated history to return to the client.
      const updatedHistory = await this.getChatHistoryUseCase.execute({ sessionId, businessId });

      return ApiResponse.success({
        history: updatedHistory.map(m => ({ ...m, timestamp: m.timestamp.toISOString() })),
        lastResponse,
      });
  }

  async getAllSessions(req: NextRequest): Promise<ApiResponse> {
    const sessions = await this.getAllSessionsUseCase.execute();
    return ApiResponse.success(sessions.map(s => ({ ...s, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt?.toISOString() })));
  }

  async getSessionDetails(req: NextRequest, { params }: { params: { sessionId: string } }): Promise<ApiResponse> {
      const { sessionId } = params;
      const businessId = req.nextUrl.searchParams.get('businessId') || undefined;

      const session = await this.getSessionByIdUseCase.execute({ sessionId, businessId });
      if (!session) {
          return ApiResponse.notFound('Chat session not found.');
      }

      const messages = await this.getChatHistoryUseCase.execute({ sessionId, businessId });

      return ApiResponse.success({
          session: { ...session, createdAt: session.createdAt.toISOString(), updatedAt: session.updatedAt?.toISOString() },
          messages: messages.map(m => ({ ...m, timestamp: m.timestamp.toISOString() })),
      });
  }

  async deleteSession(req: NextRequest, { params }: { params: { sessionId: string } }): Promise<ApiResponse> {
      return ApiResponse.notImplemented();
  }
}