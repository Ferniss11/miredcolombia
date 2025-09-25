// src/lib/chat/application/post-message.use-case.ts
import type { ChatMessage, ChatMessageRole } from '../domain/chat-message.entity';
import type { ChatRepository } from '../domain/chat.repository';
import type { AgentAdapter, AgentCompletionOutput } from '../infrastructure/ai/agent.adapter';
import type { TokenUsage } from '@/lib/chat-types';
import { adminDb } from '@/lib/firebase/admin-config';
import pdf from 'pdf-parse';

const KNOWLEDGE_BASE_COLLECTION = 'knowledge_base';

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


export type PostMessageInput = {
  sessionId: string;
  userMessage: string;
  document?: File | null;
  userId?: string;
  businessId?: string;
  agentId?: 'global' | 'valeria_premium' | 'business';
};

export type PostMessageOutput = {
  aiResponse: string;
  usage: TokenUsage;
  lastResponse: AgentCompletionOutput;
};


export class PostMessageUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly agentAdapter: AgentAdapter
  ) {}

  private async ingestDocumentForSession(document: File, sessionId: string, userId: string): Promise<string[]> {
    if (!adminDb) {
      console.warn('Firestore not initialized, skipping document ingestion.');
      return [];
    }
    console.log(`[Ingestion] Starting ingestion for document: ${document.name} in session: ${sessionId}`);

    try {
        let textContent = '';
        const buffer = Buffer.from(await document.arrayBuffer());

        if (document.type === 'application/pdf') {
            const pdfData = await pdf(buffer);
            textContent = pdfData.text;
        } else {
            textContent = buffer.toString('utf-8');
        }

        textContent = textContent.replace(/\s+/g, ' ').trim();
        if (!textContent) {
            console.warn(`[Ingestion] Document ${document.name} has no text content. Skipping.`);
            return [];
        }

        const chunks = chunkText(textContent);
        const batch = adminDb.batch();
        const collectionRef = adminDb.collection(KNOWLEDGE_BASE_COLLECTION);
        
        const docId = `${sessionId}-${document.name}-${Date.now()}`;

        chunks.forEach((chunk, index) => {
            const docRef = collectionRef.doc();
            batch.set(docRef, {
                content: chunk,
                metadata: {
                    source: 'user_session',
                    sessionId: sessionId, // Link chunk to the session
                    userId: userId,     // Link chunk to the user
                    doc_id: docId,
                    doc_title: document.name,
                    doc_type: document.type,
                    chunk_number: index + 1,
                }
            });
        });
        await batch.commit();
        console.log(`[Ingestion] Successfully indexed ${chunks.length} chunks for session ${sessionId}.`);
        return chunks;
    } catch (error) {
        console.error(`[Ingestion] Failed to process document for session ${sessionId}:`, error);
        return [];
    }
  }


  async execute({ sessionId, userMessage, document, userId, businessId, agentId }: PostMessageInput): Promise<PostMessageOutput> {
    
    // 1. Ingest document if provided
    let generatedChunks: string[] = [];
    if (document && userId) {
        generatedChunks = await this.ingestDocumentForSession(document, sessionId, userId);
    }
    
    // 2. Get history *after* potential ingestion
    const chatHistory = await this.chatRepository.getHistory(sessionId, businessId);

    // 3. Persist user message
    const userMsgEntity: Omit<ChatMessage, 'id' | 'timestamp'> = {
      sessionId,
      businessId,
      text: userMessage,
      role: 'user',
      authorId: userId,
    };
    await this.chatRepository.saveMessage(userMsgEntity);
    
    const updatedChatHistory = [...chatHistory, userMsgEntity as ChatMessage];
    
    // 4. Invoke AI agent
    const agentResponse = await this.agentAdapter.getCompletion({
        chatHistory: updatedChatHistory,
        currentMessage: userMessage,
        businessId,
        sessionId: sessionId,
        agentId,
    });

    // 5. Persist AI response
    const aiMsgEntity: Omit<ChatMessage, 'id' | 'timestamp'> = {
      sessionId,
      businessId,
      text: agentResponse.response,
      role: 'model',
      usage: agentResponse.usage,
      cost: agentResponse.cost,
    };
    await this.chatRepository.saveMessage(aiMsgEntity, agentResponse.agentConfig);
    
    // Enrich the debug info from the agent adapter with any data from this use case
    const finalDebugInfo = {
        ...agentResponse.debugInfo,
        generatedChunks: generatedChunks.length > 0 ? { count: generatedChunks.length, firstChunk: generatedChunks[0] } : undefined,
    };

    const lastResponse: AgentCompletionOutput = {
        ...agentResponse,
        debugInfo: Object.keys(finalDebugInfo).length > 0 ? finalDebugInfo : undefined,
    };
    
    return {
      aiResponse: agentResponse.response,
      usage: agentResponse.usage,
      lastResponse: lastResponse,
    };
  }
}
