
'use server';

/**
 * @fileOverview Defines a Genkit tool for searching the knowledge base.
 */
import { ai } from '@/ai/genkit';
import { getAdminServices } from '@/lib/firebase/admin-config';
import { z } from 'zod';

const SearchResultSchema = z.object({
  content: z.string().describe('The content of the search result.'),
  source: z.string().describe('The source or ID of the content.'),
});

// This is the implementation of the RAG (Retrieval-Augmented Generation) pattern.
export const knowledgeBaseSearch = ai.defineTool(
  {
    name: 'knowledgeBaseSearch',
    description: 'Searches the knowledge base for information about immigration to Spain for Colombians. Use this to answer user questions about legal procedures, documents, visas, etc.',
    inputSchema: z.object({
      query: z.string().describe('The user\'s question or search query.'),
    }),
    outputSchema: z.object({
      results: z.array(SearchResultSchema).describe('A list of relevant knowledge base chunks.'),
    }),
  },
  async (input) => {
    console.log(`[Knowledge Base Search] Searching for: ${input.query}`);
    const { db: adminDb } = getAdminServices();

    try {
      const { nearestNeighbors } = await adminDb.collection('knowledge')
        .vectorSearch(
          'embedding',
          {
            query: input.query,
            k: 3, // Find the top 3 most relevant documents
          },
        );
      
      if (!nearestNeighbors || nearestNeighbors.length === 0) {
        console.log('[Knowledge Base Search] No relevant documents found.');
        return { results: [] };
      }
      
      const results = nearestNeighbors.map(neighbor => ({
        content: neighbor.document.get('content') || '',
        source: neighbor.document.id,
      }));

      console.log(`[Knowledge Base Search] Found ${results.length} results.`);
      return { results };

    } catch (error) {
      console.error("[Knowledge Base Search] Error performing vector search:", error);
      // Return empty results in case of error to avoid breaking the flow.
      return { results: [] };
    }
  }
);
