
'use server';

/**
 * @fileOverview Defines a Genkit tool for searching the knowledge base vector store.
 * This tool now leverages the `firebase/firestore-vector-search` extension to generate
 * embeddings, ensuring consistency with the indexing process and bypassing environment-specific
 * authentication issues with direct `ai.embed()` calls.
 */
import { ai } from '@/ai/genkit';
import { adminDb } from '@/lib/firebase/admin-config';
import { z } from 'zod';
import type { VectorQuery, VectorQuerySnapshot } from '@google-cloud/firestore';
import { googleAI } from '@genkit-ai/googleai';

const KNOWLEDGE_BASE_COLLECTION = 'knowledge_base';
const TEMP_QUERY_COLLECTION = 'temp_query_vectors'; // Use a separate collection for temporary queries

/**
 * Waits for the Firestore vector search extension to process a document and add an embedding.
 * @param docRef - The DocumentReference of the temporary document containing the query.
 * @param timeout - The maximum time to wait in milliseconds.
 * @returns The generated embedding vector.
 */
async function waitForEmbedding(docRef: FirebaseFirestore.DocumentReference, timeout = 10000): Promise<number[]> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const docSnap = await docRef.get();
        const data = docSnap.data();
        // The extension writes the embedding into this field
        if (data?.embedding) {
            return data.embedding;
        }
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait before polling again
    }
    throw new Error('Timeout waiting for embedding generation from Firebase extension.');
}


export const knowledgeBaseSearch = ai.defineTool(
  {
    name: 'knowledgeBaseSearch',
    description: 'Searches the knowledge base for information relevant to a user\'s query. This should be the first step for answering any user question. It can search the general knowledge base and/or documents specific to the current user session.',
    inputSchema: z.object({
      query: z.string().describe('The user\'s question or topic to search for.'),
    }),
    outputSchema: z.string(),
  },
  async ({ query }, { context }) => {
    
    const sessionId = (context as any)?.sessionId as string | undefined;
    const debugLogs: any[] = [];
    let tempDocRef: FirebaseFirestore.DocumentReference | null = null;

    try {
      debugLogs.push("Paso 1: Iniciando la herramienta `knowledgeBaseSearch`.");
      if (!adminDb) {
        throw new Error("[Tool Error] Firestore (adminDb) no está inicializado.");
      }

      debugLogs.push(`Paso 2: Creando documento temporal en '${TEMP_QUERY_COLLECTION}' con la consulta: "${query}".`);
      
      // Create a temporary document that the extension will process
      tempDocRef = adminDb.collection(TEMP_QUERY_COLLECTION).doc();
      await tempDocRef.set({ content: query });
      
      debugLogs.push(`Paso 3: Esperando a que la extensión de Firebase genere el vector para el doc temporal '${tempDocRef.id}'.`);
      const queryVector = await waitForEmbedding(tempDocRef);
      debugLogs.push(`Paso 4: Vector recibido de la extensión con ${queryVector.length} dimensiones.`);

      const collectionRef = adminDb.collection(KNOWLEDGE_BASE_COLLECTION);
      
      debugLogs.push("Paso 5: Construyendo la consulta de búsqueda de vectores (findNearest).");
      const vectorQuery: VectorQuery = collectionRef.findNearest({
        vectorField: 'embedding',
        queryVector: queryVector,
        limit: 10,
        distanceMeasure: 'COSINE',
      });
      
      debugLogs.push('Paso 6: Ejecutando la búsqueda de vectores en Firestore.');
      const querySnapshot: VectorQuerySnapshot = await vectorQuery.get();
      debugLogs.push(`Paso 7: Búsqueda completada. ${querySnapshot.docs.length} documentos encontrados inicialmente.`);

      const finalResults = querySnapshot.docs.filter(doc => {
        const metadata = doc.data().metadata;
        if (!metadata) return false;
        if (metadata.source === 'admin_kb') return true;
        if (sessionId && metadata.source === 'user_session' && metadata.sessionId === sessionId) return true;
        return false;
      });
      debugLogs.push(`Paso 8: Filtrado completado. ${finalResults.length} documentos relevantes para el contexto actual.`);

      if (finalResults.length === 0) {
        return `[INFO: Búsqueda completada, no se encontraron documentos relevantes para la consulta: "${query}". Informa al usuario amablemente que no tienes información sobre ese tema y pregúntale si puede ser más específico.]`;
      }
      
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
    } finally {
        // Clean up the temporary document
        if (tempDocRef) {
            await tempDocRef.delete();
            debugLogs.push(`Paso final: Documento temporal '${tempDocRef.id}' eliminado.`);
        }
    }
  }
);
