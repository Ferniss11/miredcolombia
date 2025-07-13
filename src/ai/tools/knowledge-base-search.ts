
'use server';

/**
 * @fileOverview Defines a Genkit tool for searching the knowledge base vector store.
 */
import { ai } from '@/ai/genkit';
import { getAdminServices } from '@/lib/firebase/admin-config';
import { z } from 'zod';

const { db } = getAdminServices();

const KnowledgeSearchResultSchema = z.object({
  content: z.string().describe('A chunk of text from the knowledge base relevant to the user query.'),
  source: z.string().describe('The source document or URL for the content chunk.'),
});

export const knowledgeBaseSearch = ai.defineTool(
  {
    name: 'knowledgeBaseSearch',
    description: 'Searches the knowledge base for information relevant to a user\'s query about immigration to Spain. This should be the first step for answering any user question.',
    inputSchema: z.object({
      query: z.string().describe('The user\'s question or topic to search for.'),
    }),
    outputSchema: z.object({
      results: z.array(KnowledgeSearchResultSchema).describe('A list of relevant knowledge base chunks.'),
    }),
  },
  async ({ query }) => {
    console.log(`[Knowledge Base] Searching for: "${query}"`);
    try {
      // The Firebase Vector Search extension makes documents searchable via the findNeighbors operator.
      const results = await db.collection('knowledge').findNeighbors('embedding', {
        query: query,
        limit: 5, // Retrieve the top 5 most relevant chunks
        distanceMeasure: 'COSINE',
      });

      if (!results || results.length === 0) {
        console.log('[Knowledge Base] No relevant documents found.');
        return { results: [] };
      }

      const searchResults = results.map(neighbor => {
        const data = neighbor.document.data();
        return {
          content: data.content || '', // The text chunk
          source: data.source || 'Fuente desconocida', // The source of the info
        };
      });
      
      console.log(`[Knowledge Base] Found ${searchResults.length} relevant chunks.`);
      return { results: searchResults };

    } catch (error) {
      console.error("[Knowledge Base] Error performing vector search:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // It's better to return an empty result than to throw, so the AI can handle it gracefully.
      // We can add more robust error logging/reporting here in a real application.
      return { results: [] };
    }
  }
);
