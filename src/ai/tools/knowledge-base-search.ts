
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
      const vectorQuery = await adminDb.collection('knowledge_base').findNeighbors('embedding', {
        query: query,
        limit: 5,
        distanceMeasure: 'COSINE',
      });
      
      let finalResults = vectorQuery;

      // If a session ID is provided, we need to filter the results to include
      // either global knowledge OR documents from this specific session.
      if (sessionId) {
        finalResults = vectorQuery.filter(neighbor => {
          const metadata = neighbor.document.data().metadata;
          if (!metadata) return false;
          
          // Condition 1: It's a global document from the admin knowledge base
          const isGlobalDoc = metadata.source === 'admin_kb';
          
          // Condition 2: It's a document from the current user's session
          const isSessionDoc = metadata.source === 'user_session' && metadata.sessionId === sessionId;
          
          return isGlobalDoc || isSessionDoc;
        });
      } else {
        // If no session ID, only return global knowledge base documents.
        finalResults = vectorQuery.filter(neighbor => {
            const metadata = neighbor.document.data().metadata;
            return metadata?.source === 'admin_kb';
        });
      }


      if (!finalResults || finalResults.length === 0) {
        console.log('[Knowledge Base] No relevant documents found after filtering.');
        return { results: [] };
      }

      const searchResults = finalResults.map(neighbor => {
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
