
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

async function ingestSessionDocument(file: File, sessionId: string, userId: string): Promise<string[]> {
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
                source: 'user_session', // Distinguishes from admin-uploaded content
                sessionId,
                userId,
                doc_title: file.name,
                chunk_number: index + 1,
            }
        });
    });

    await batch.commit();
    console.log(`[ChatController] Indexed ${chunks.length} chunks for session ${sessionId}.`);
    return chunks; // Return the generated chunks for debugging
}


// --- Input Validation Schemas ---
const StartSessionSchema = z.object({
  userName: z.string().min(2),
  userPhone: z.string().optional(),
  userEmail: z.string().email().optional().or(z.literal('')),
  businessId: z.string().optional(),
  userId: z.string().optional(),
  isLabSession: z.boolean().optional(),
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

    // If it's a lab session, we just need to create it without resuming logic.
    if (input.isLabSession) {
        const chatRepository = new FirestoreChatRepository();
        const startChatSessionUseCase = new StartChatSessionUseCase(chatRepository);
        const { session, history } = await startChatSessionUseCase.execute(input);
        return ApiResponse.success({
            session: { ...session, createdAt: session.createdAt.toISOString() },
            history: history.map(m => ({ ...m, timestamp: m.timestamp.toISOString() })),
        });
    }

    // For regular users, use the full start-or-resume logic.
    const { session, history } = await this.startOrResumeChatUseCase.execute(input);

    return ApiResponse.success({
        session: { ...session, createdAt: session.createdAt.toISOString() },
        history: history.map(m => ({ ...m, timestamp: m.timestamp.toISOString() })),
    });
  }
  
  async postMessage(payload: PostMessagePayload): Promise<ApiResponse> {
      let { userMessage, userId, sessionId, businessId, document, agentId } = payload;
      let generatedChunks: string[] | undefined = undefined;

      if (!sessionId) {
          return ApiResponse.badRequest('Session ID is missing.');
      }
      
      if (document && userId) {
          generatedChunks = await ingestSessionDocument(document, sessionId, userId);
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
        // Also return the last response for metadata purposes in the lab
        lastResponse: {
          ...lastResponse,
          debugInfo: {
            ...lastResponse.debugInfo,
            generatedChunks, // Add generated chunks to debug info
          }
        },
      });
  }

  async getAllSessions(req: NextRequest): Promise<ApiResponse> {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const isLabSession = searchParams.get('isLabSession') === 'true';

    const sessions = await this.chatRepository.findAllSessions({ userId, isLabSession });
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
    const { sessionId } = params;
    // Note: In a real app, you would add more authorization here to ensure
    // the user deleting the session is the owner or an admin.
    // For the lab, this is acceptable.
    await this.chatRepository.deleteSession(sessionId);
    return ApiResponse.noContent();
  }
}
