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
    const debugLogs: string[] = [];
    let queryVector: number[] | undefined;

    try {
      debugLogs.push('Paso 1: Iniciando la herramienta `knowledgeBaseSearch`.');
      if (!adminDb) {
        throw new Error("[Tool Error] Firestore (adminDb) no está inicializado.");
      }

      // Step 2: Generate an embedding for the user's query.
      debugLogs.push(`Paso 2: Generando embedding para la consulta: "${query}" usando el modelo 'embedding-004'.`);
      const embeddingResult = await ai.embed({
        embedder: 'embedding-004',
        content: query,
      });
      
      queryVector = embeddingResult.embedding;
      debugLogs.push(`Paso 3: Verificando el resultado del embedding. Vector recibido: ${queryVector ? 'Sí' : 'No'}.`);

      if (!queryVector) throw new Error("La API no devolvió un vector de embedding.");
      
      const collectionRef = adminDb.collection(KNOWLEDGE_BASE_COLLECTION);
      
      // Step 4: Perform vector search to find the nearest neighbors.
      debugLogs.push('Paso 4: Construyendo la consulta de búsqueda de vectores (findNearest).');
      const vectorQuery: VectorQuery = collectionRef.findNearest({
        vectorField: 'embedding',
        queryVector: queryVector,
        limit: 10,
        distanceMeasure: 'COSINE',
      });
      
      debugLogs.push('Paso 5: Ejecutando la búsqueda de vectores en Firestore.');
      const querySnapshot: VectorQuerySnapshot = await vectorQuery.get();
      debugLogs.push(`Paso 6: Búsqueda completada. ${querySnapshot.docs.length} documentos encontrados inicialmente.`);

      // Step 7: Filter the results based on the context (session or global)
      const finalResults = querySnapshot.docs.filter(doc => {
        const metadata = doc.data().metadata;
        if (!metadata) return false;

        // Include global 'admin_kb' documents
        if (metadata.source === 'admin_kb') return true;
        // Include session-specific documents if a sessionId is present
        if (sessionId && metadata.source === 'user_session' && metadata.sessionId === sessionId) return true;

        return false;
      });
      debugLogs.push(`Paso 7: Filtrado completado. ${finalResults.length} documentos relevantes para el contexto actual.`);

      if (finalResults.length === 0) {
        return `[INFO: Búsqueda completada, no se encontraron documentos relevantes para la consulta: "${query}". Informa al usuario amablemente que no tienes información sobre ese tema y pregúntale si puede ser más específico.]`;
      }
      
      // Step 8: Limit to top N results and format the output into a single string.
      const topResults = finalResults.slice(0, 5);

      const searchResultsText = topResults.map(doc => {
        const data = doc.data();
        const content = data.content || '';
        const source = data.metadata?.doc_title || 'Fuente desconocida';
        return `Fuente: ${source}\nContenido: ${content}\n---`;
      }).join('\n\n');
      
      return `[INFO: Búsqueda completada. Documentos encontrados:\n${searchResultsText}]`;

    } catch (error) {
      debugLogs.push('!!! ERROR CAPTURADO EN LA HERRAMIENTA !!!');
      const fullError = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
      
      const debugObject = {
        error: `La herramienta de búsqueda de conocimiento falló.`,
        causa: error instanceof Error ? error.message : "Error desconocido",
        pasos_ejecutados: debugLogs,
        error_completo: fullError,
      };

      return JSON.stringify(debugObject, null, 2);
    }
  }
);
