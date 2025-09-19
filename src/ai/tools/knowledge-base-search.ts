
'use server';

/**
 * @fileOverview Defines a Genkit tool for searching the knowledge base vector store.
 * This tool is now context-aware and can search both the admin's knowledge base
 * and documents uploaded during a specific user session.
 */
import { ai } from '@/ai/genkit';
import { adminDb } from '@/lib/firebase/admin-config';
import { z } from 'zod';

const KnowledgeSearchResultSchema = z.object({
  content: z.string().describe('A chunk of text from the knowledge base relevant to the user query.'),
  source: z.string().describe('The source document or URL for the content chunk.'),
});

export const knowledgeBaseSearch = ai.defineTool(
  {
    name: 'knowledgeBaseSearch',
    description: 'Searches the knowledge base for information relevant to a user\'s query. This should be the first step for answering any user question. It can search the general knowledge base and/or documents specific to the current user session.',
    inputSchema: z.object({
      query: z.string().describe('The user\'s question or topic to search for.'),
      sessionId: z.string().optional().describe('The ID of the current chat session. If provided, the search will also include documents uploaded by the user in this session.'),
    }),
    outputSchema: z.object({
      results: z.array(KnowledgeSearchResultSchema).describe('A list of relevant knowledge base chunks.'),
    }),
  },
  async ({ query, sessionId }) => {
    console.log(`[Knowledge Base] Searching for: "${query}" (Session: ${sessionId || 'None'})`);

    if (!adminDb) {
      console.error("[Knowledge Base] Firestore not initialized.");
      return { results: [] };
    }

    try {
      // The Firebase Vector Search extension makes documents searchable via the findNeighbors operator.
      // We can add a filter to search within a specific context (admin_kb or user_session).
      
      const filters: any[] = [{ field: 'metadata.source', op: '==', value: 'admin_kb' }];
      if (sessionId) {
        filters.push({ field: 'metadata.sessionId', op: '==', value: sessionId });
      }

      const results = await adminDb.collection('knowledge_base').findNeighbors('embedding', {
        query: query,
        limit: 5,
        distanceMeasure: 'COSINE',
        // If a sessionId is provided, search in BOTH admin docs AND session docs.
        // If not, just search admin docs.
        filter: sessionId ? { or: filters } : { and: filters }
      });

      if (!results || results.length === 0) {
        console.log('[Knowledge Base] No relevant documents found.');
        return { results: [] };
      }

      const searchResults = results.map(neighbor => {
        const data = neighbor.document.data();
        return {
          content: data.content || '', // The text chunk
          source: data.metadata?.doc_title || 'Fuente desconocida', // The source of the info
        };
      });
      
      console.log(`[Knowledge Base] Found ${searchResults.length} relevant chunks.`);
      return { results: searchResults };

    } catch (error) {
      console.error("[Knowledge Base] Error performing vector search:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return { results: [] };
    }
  }
);
