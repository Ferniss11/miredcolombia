
// src/lib/chat/infrastructure/api/agent-lab.controller.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiResponse } from '@/lib/platform/api/api-response';
import { GenkitAgentAdapter } from '../ai/genkit-agent.adapter';
import { SimulateAgentResponseUseCase } from '../../application/simulate-agent-response.use-case';
import { ChatMessageSchema } from '@/lib/chat-types';
import { adminDb } from '@/lib/firebase/admin-config';

// Helper function to handle document ingestion for the lab session
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

async function ingestLabDocument(file: File, sessionId: string, userId: string) {
    if (!adminDb) {
        throw new Error('Firestore not initialized for document ingestion.');
    }

    let textContent = '';
    try {
        const pdfParse = (await import('pdf-parse')).default;
        const buffer = Buffer.from(await file.arrayBuffer());
        const data = await pdfParse(buffer);
        textContent = data.text.replace(/\s+/g, ' ').trim();
    } catch (e) {
        console.error(`[AgentLab] Failed to parse PDF for lab session ${sessionId}`, e);
        throw new Error('Could not read the provided PDF file.');
    }

    if (!textContent) {
        throw new Error('The uploaded document appears to be empty.');
    }

    const chunks = chunkText(textContent);
    const batch = adminDb.batch();
    const collectionRef = adminDb.collection('knowledge_base');

    chunks.forEach((chunk, index) => {
        const docRef = collectionRef.doc();
        batch.set(docRef, {
            content: chunk,
            metadata: {
                source: 'user_session', // We use 'user_session' to simulate the user flow
                sessionId,
                userId,
                doc_title: file.name,
                chunk_number: index + 1,
            }
        });
    });

    await batch.commit();
    console.log(`[AgentLab] Indexed ${chunks.length} chunks for lab session ${sessionId}.`);
}


export class AgentLabController {
  private simulateAgentResponseUseCase: SimulateAgentResponseUseCase;

  constructor() {
    const agentAdapter = new GenkitAgentAdapter();
    this.simulateAgentResponseUseCase = new SimulateAgentResponseUseCase(agentAdapter);
  }

  async simulateChat(req: NextRequest): Promise<ApiResponse> {
    const formData = await req.formData();
    
    const agentId = formData.get('agentId') as 'global' | 'valeria_premium' | 'business';
    const currentMessage = formData.get('currentMessage') as string;
    const chatHistory = JSON.parse(formData.get('chatHistory') as string);
    const businessId = formData.get('businessId') as string | undefined;
    const contextFile = formData.get('document') as File | null;
    const userId = formData.get('userId') as string; // We'll need the user ID for metadata
    const sessionId = formData.get('sessionId') as string; // And a session ID
    
    // --- New Ingestion Logic ---
    if (contextFile && userId && sessionId) {
        try {
            await ingestLabDocument(contextFile, sessionId, userId);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during ingestion.';
            return ApiResponse.error(`Failed to process document: ${errorMessage}`);
        }
    }

    const output = await this.simulateAgentResponseUseCase.execute({
      agentId,
      chatHistory,
      currentMessage,
      businessId,
      sessionId, // Pass the session ID to the use case
    });
    
    return ApiResponse.success({ response: output.response, usage: output.usage });
  }
}
