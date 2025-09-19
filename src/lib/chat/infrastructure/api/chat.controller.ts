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
import { adminAuth, adminDb } from '@/lib/firebase/admin-config';
import pdf from 'pdf-parse';
import { StartOrResumeChatUseCase } from '../../application/start-or-resume-chat.use-case';
import { SimulateAgentResponseUseCase } from '../../application/simulate-agent-response.use-case';


// --- Helper function for session document ingestion ---
const chunkText = (text: string, chunkSize = 1500, overlap = 200): string[] => {
    const chunks: string[] = [];
    if (!text) return chunks;
    let i = 0;
    while (i < text.length) {
        const end = Math.min(i + chunkSize, text.length);
        chunks.push(text.slice(i, end));
        i += chunkSize - overlap;
    }
    return chunks;
};

async function ingestSessionDocument(file: File, sessionId: string, userId: string) {
    if (!adminDb) {
        throw new Error('Firestore not initialized for document ingestion.');
    }
    
    let textContent = '';
    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const data = await pdf(buffer);
        textContent = data.text.replace(/\s+/g, ' ').trim();
    } catch (e) {
        console.error(`[ChatController] Failed to parse PDF for session ${sessionId}`, e);
        throw new Error('Could not read the provided PDF file.');
    }
    
    if (!textContent) {
        throw new Error('The uploaded document appears to be empty.');
    }

    const chunks = chunkText(textContent);
    const batch = adminDb.batch();
    const collectionRef = adminDb.collection('knowledge_base');

    chunks.forEach((chunk, index) => {
        const docRef = collectionRef.doc(); // Auto-generate ID
        batch.set(docRef, {
            content: chunk,
            metadata: {
                source: 'user_session',
                sessionId,
                userId,
                doc_title: file.name,
                chunk_number: index + 1,
            }
        });
    });

    await batch.commit();
    console.log(`[ChatController] Indexed ${chunks.length} chunks for session ${sessionId}.`);
}


// --- Input Validation Schemas ---
const StartSessionSchema = z.object({
  userName: z.string().min(2),
  userPhone: z.string().optional(),
  userEmail: z.string().email().optional().or(z.literal('')),
  businessId: z.string().optional(),
  userId: z.string().optional(), // Added userId for logged-in users
});

export type PostMessagePayload = {
    userMessage: string;
    userId?: string;
    sessionId?: string;
    businessId?: string;
    document?: File | null;
    isLabMode?: boolean;
    agentId?: 'global' | 'valeria_premium' | 'business';
};


export class ChatController {
  private startOrResumeChatUseCase: StartOrResumeChatUseCase;
  private postMessageUseCase: PostMessageUseCase;
  private simulateAgentResponseUseCase: SimulateAgentResponseUseCase;
  private getAllSessionsUseCase: GetAllChatSessionsUseCase;
  private getSessionByIdUseCase: GetSessionByIdUseCase;
  private getChatHistoryUseCase: GetChatHistoryUseCase;
  
  constructor() {
    const chatRepository = new FirestoreChatRepository();
    const agentAdapter = new GenkitAgentAdapter();
    const userRepository = new FirestoreUserRepository();
    
    const startChatSessionUseCase = new StartChatSessionUseCase(chatRepository);
    this.getChatHistoryUseCase = new GetChatHistoryUseCase(chatRepository);
    this.getSessionByIdUseCase = new GetSessionByIdUseCase(chatRepository);
    this.startOrResumeChatUseCase = new StartOrResumeChatUseCase(
        startChatSessionUseCase,
        this.getChatHistoryUseCase,
        userRepository,
        this.getSessionByIdUseCase
    );
    this.postMessageUseCase = new PostMessageUseCase(chatRepository, agentAdapter);
    this.simulateAgentResponseUseCase = new SimulateAgentResponseUseCase(agentAdapter);
    this.getAllSessionsUseCase = new GetAllChatSessionsUseCase(chatRepository);
  }

  async startSession(req: NextRequest): Promise<ApiResponse> {
    const json = await req.json();
    const input = StartSessionSchema.parse(json);

    const { session, history } = await this.startOrResumeChatUseCase.execute(input);

    return ApiResponse.success({
        session: { ...session, createdAt: session.createdAt.toISOString() },
        history: history.map(m => ({ ...m, timestamp: m.timestamp.toISOString() })),
    });
  }
  
  async postMessage(payload: PostMessagePayload): Promise<ApiResponse> {
      let { userMessage, userId, sessionId, businessId, document, isLabMode, agentId } = payload;
      
      if (!sessionId) {
          return ApiResponse.badRequest('Session ID is missing.');
      }
      
      // If we are in Lab mode, but no session document exists, we must create one.
      if (isLabMode) {
          const chatRepository = new FirestoreChatRepository();
          let existingSession = await chatRepository.findSessionById(sessionId);
          if (!existingSession) {
              await chatRepository.createSessionWithInitialMessage({
                  userName: 'Lab User',
                  userPhone: '',
                  userId: userId || 'lab-user-id',
                  createdAt: new Date(),
                  totalTokens: 0,
                  totalInputTokens: 0,
                  totalOutputTokens: 0,
                  totalCost: 0,
              }, `Inicio de sesión de laboratorio: ${sessionId}`);
          }
      }

      if (document && userId) {
          await ingestSessionDocument(document, sessionId, userId);
          if (!userMessage) {
              userMessage = `Acabo de subir el documento "${document.name}". ¿Puedes resumirlo por mí?`;
          }
      }

      if (isLabMode && agentId) {
          // Lab mode: just get the AI response without persisting much
          const history = await this.getChatHistoryUseCase.execute({ sessionId, businessId });
          const output = await this.simulateAgentResponseUseCase.execute({
              agentId,
              chatHistory: history,
              currentMessage: userMessage,
              sessionId: sessionId,
              businessId: businessId
          });
          return ApiResponse.success(output);
      }

      // Regular chat mode: persist messages and get response
      const output = await this.postMessageUseCase.execute({
          sessionId,
          userMessage,
          userId,
          businessId,
      });

      return ApiResponse.success(output);
  }

  async getAllSessions(req: NextRequest): Promise<ApiResponse> {
    const sessions = await this.getAllSessionsUseCase.execute();
    return ApiResponse.success(sessions.map(s => ({ ...s, createdAt: s.createdAt.toISOString() })));
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
          session: { ...session, createdAt: session.createdAt.toISOString() },
          messages: messages.map(m => ({ ...m, timestamp: m.timestamp.toISOString() })),
      });
  }
}
