
'use server';

/**
 * @fileOverview Defines a Genkit tool for searching the knowledge base vector store.
 * This tool is now context-aware and can search both the admin's knowledge base
 * and documents uploaded during a specific user session.
 */
import { ai } from '@/ai/genkit';
import { adminDb } from '@/lib/firebase/admin-config';
import { z } from 'zod';
import type { VectorQuery, VectorQuerySnapshot } from '@google-cloud/firestore';

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
    }),
    outputSchema: z.object({
      results: z.array(KnowledgeSearchResultSchema).describe('A list of relevant knowledge base chunks.'),
    }),
  },
  // The 'context' parameter is automatically populated by Genkit from the flow's call context
  async ({ query }, { context }) => {
    const sessionId = (context as any)?.sessionId as string | undefined;
    console.log(`[Knowledge Base] Searching for: "${query}" (Session: ${sessionId || 'None'})`);

    if (!adminDb) {
      console.error("[Knowledge Base] Firestore not initialized.");
      return { results: [{ content: 'Error: La base de datos no está inicializada.', source: 'Sistema' }] };
    }

    try {
      // Step 1: Generate an embedding for the user's query.
      const embeddingResult = await ai.embed({
        embedder: 'googleai/text-embedding-004',
        content: query,
      });

      const queryVector = embeddingResult.embedding;
      if (!queryVector) throw new Error("Failed to generate embedding for the query.");
      
      const collectionRef = adminDb.collection(KNOWLEDGE_BASE_COLLECTION);
      
      // Step 2: Perform the vector search to find the nearest neighbors.
      const vectorQuery: VectorQuery = collectionRef.findNearest({
        vectorField: 'embedding',
        queryVector: queryVector,
        limit: 10, // Get more initial results to filter from
        distanceMeasure: 'COSINE',
      });
      
      const querySnapshot: VectorQuerySnapshot = await vectorQuery.get();

      // Step 3: Filter the results based on the context (session or global)
      const finalResults = querySnapshot.docs.filter(doc => {
        const metadata = doc.data().metadata;
        if (!metadata) return false;

        // Document is global and available to all
        if (metadata.source === 'admin_kb') return true;

        // Document is session-specific and matches the current session
        if (sessionId && metadata.source === 'user_session' && metadata.sessionId === sessionId) return true;

        return false;
      });

      if (finalResults.length === 0) {
        console.log('[Knowledge Base] No relevant documents found after filtering.');
        return {
          results: [{
            content: `No se encontró información en la base de conocimiento sobre: "${query}". Informa al usuario amablemente que no tienes información sobre ese tema y pregúntale si puede ser más específico o proporcionar el documento.`,
            source: 'Sistema de Búsqueda Interno',
          }]
        };
      }
      
      // Step 4: Limit to top N results after filtering and format the output.
      const topResults = finalResults.slice(0, 5);

      const searchResults = topResults.map(doc => {
        const data = doc.data();
        return {
          content: data.content || '',
          source: data.metadata?.doc_title || 'Fuente desconocida',
        };
      });
      
      console.log(`[Knowledge Base] Found ${searchResults.length} relevant chunks.`);
      return { results: searchResults };

    } catch (error) {
      console.error("[Knowledge Base] Error performing vector search:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Return a helpful error message to the LLM.
      return { 
          results: [{ 
              content: `Error durante la búsqueda en la base de conocimiento: ${errorMessage}. Informa al usuario que ha habido un problema técnico al buscar la información.`, 
              source: 'Sistema de Errores' 
          }] 
      };
    }
  }
);
