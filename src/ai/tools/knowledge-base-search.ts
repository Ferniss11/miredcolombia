
'use server';

/**
 * @fileOverview Defines a Genkit tool for searching the knowledge base vector store.
 * This tool is now context-aware and can search both the admin's knowledge base
 * and documents uploaded during a specific user session.
 * It now returns a formatted string to be directly consumable by the LLM.
 */
import { ai } from '@/ai/genkit';
import { adminDb } from '@/lib/firebase/admin-config';
import { z } from 'zod';
import type { VectorQuery, VectorQuerySnapshot } from '@google-cloud/firestore';

const KNOWLEDGE_BASE_COLLECTION = 'knowledge_base';

export const knowledgeBaseSearch = ai.defineTool(
  {
    name: 'knowledgeBaseSearch',
    description: 'Searches the knowledge base for information relevant to a user\'s query. This should be the first step for answering any user question. It can search the general knowledge base and/or documents specific to the current user session.',
    inputSchema: z.object({
      query: z.string().describe('The user\'s question or topic to search for.'),
    }),
    // The tool now returns a single formatted string for the LLM to process.
    outputSchema: z.string(),
  },
  // The 'context' parameter is automatically populated by Genkit from the flow's call context
  async ({ query }, { context }) => {
    
    const sessionId = (context as any)?.sessionId as string | undefined;

    try {
      if (!adminDb) {
        throw new Error("[Tool Error] Firestore not initialized.");
      }

      // Step 1: Generate an embedding for the user's query.
      const embeddingResult = await ai.embed({
        embedder: 'googleai/text-embedding-004',
        content: query,
      });

      const queryVector = embeddingResult.embedding;
      if (!queryVector) throw new Error("Failed to generate embedding for the query.");
      
      const collectionRef = adminDb.collection(KNOWLEDGE_BASE_COLLECTION);
      
      // Step 2: Perform vector search to find the nearest neighbors.
      const vectorQuery: VectorQuery = collectionRef.findNearest({
        vectorField: 'embedding',
        queryVector: queryVector,
        limit: 10,
        distanceMeasure: 'COSINE',
      });
      
      const querySnapshot: VectorQuerySnapshot = await vectorQuery.get();

      // Step 3: Filter the results based on the context (session or global)
      const finalResults = querySnapshot.docs.filter(doc => {
        const metadata = doc.data().metadata;
        if (!metadata) return false;

        // Include global 'admin_kb' documents
        if (metadata.source === 'admin_kb') return true;
        // Include session-specific documents if a sessionId is present
        if (sessionId && metadata.source === 'user_session' && metadata.sessionId === sessionId) return true;

        return false;
      });

      if (finalResults.length === 0) {
        return `[INFO: Búsqueda completada, no se encontraron documentos relevantes para la consulta: "${query}". Informa al usuario amablemente que no tienes información sobre ese tema y pregúntale si puede ser más específico.]`;
      }
      
      // Step 4: Limit to top N results and format the output into a single string.
      const topResults = finalResults.slice(0, 5);

      const searchResultsText = topResults.map(doc => {
        const data = doc.data();
        const content = data.content || '';
        const source = data.metadata?.doc_title || 'Fuente desconocida';
        return `Fuente: ${source}\nContenido: ${content}\n---`;
      }).join('\n\n');
      
      return `[INFO: Búsqueda completada. Documentos encontrados:\n${searchResultsText}]`;

    } catch (error) {
      console.error("[Knowledge Base Tool] Error performing vector search:", error);
      // **NEW**: Serialize the full error object for detailed debugging.
      const fullError = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
      return `[ERROR: La herramienta de búsqueda de conocimiento falló. Error completo: ${fullError}]`;
    }
  }
);
