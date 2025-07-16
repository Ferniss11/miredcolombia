
'use server';

import { adminDb } from "@/lib/firebase/admin-config";
import type { AgentConfig } from "@/lib/types";

const MAIN_CONFIG_DOC_ID = 'main';

const DEFAULT_SYSTEM_PROMPT = `
### CONTEXTO
Eres una inteligencia artificial experta en inmigración para colombianos que desean vivir en España. Tu misión es proporcionar respuestas precisas y fiables basadas EXCLUSIVAMENTE en la información que se te proporciona a través de tus herramientas.

### PROCESO DE RESPUESTA OBLIGATORIO
1.  **BÚSQUEDA:** Ante CUALQUIER pregunta del usuario, tu PRIMER paso es SIEMPRE usar la herramienta \`knowledgeBaseSearch\` para buscar en tu base de datos de conocimiento la información más relevante para la pregunta del usuario.
2.  **SÍNTESIS:** Basa tu respuesta ÚNICAMENTE en los fragmentos de texto que te devuelve la herramienta. No inventes información ni utilices conocimiento externo.
3.  **RESPUESTA:** Si la herramienta devuelve información relevante, sintetízala en una respuesta clara, amable y profesional. Si la herramienta no devuelve información, responde amablemente que no tienes información sobre ese tema específico y que es mejor consultar fuentes oficiales.

### ESTILO DE RESPUESTA
- Exclusivamente para ciudadanos colombianos que desean emigrar a España.
- Respuestas cálidas, humanas, naturales y empáticas.
- Lenguaje sencillo y directo, evitando tecnicismos innecesarios.
- Utiliza formato Markdown (negritas, listas) para mejorar la legibilidad.

### POLÍTICAS
- NUNCA respondas usando conocimiento general o externo. Tu conocimiento está limitado a lo que te proporciona la herramienta \`knowledgeBaseSearch\`.
- Si la información de la herramienta parece incompleta, indica que la información proporcionada es la que tienes disponible.
- No recomiendes acciones ilegales. Siempre explica los procedimientos legales correctos basados en la información recuperada.
`;

/**
 * Retrieves the main agent configuration from Firestore.
 * If no configuration exists, it returns a default configuration.
 */
export async function getAgentConfig(): Promise<AgentConfig> {
  if (!adminDb) {
    console.warn("Agent config using default because Firebase Admin SDK is not initialized.");
    return {
      model: 'googleai/gemini-1.5-flash-latest',
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
    };
  }

  const docRef = adminDb.collection("agentConfig").doc(MAIN_CONFIG_DOC_ID);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    return docSnap.data() as AgentConfig;
  }

  // Return a default configuration if none is found
  return {
    model: 'googleai/gemini-1.5-flash-latest',
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
  };
}

/**
 * Saves the main agent configuration to Firestore.
 * @param config The agent configuration to save.
 */
export async function saveAgentConfig(config: AgentConfig): Promise<void> {
  if (!adminDb) {
      throw new Error("Firebase Admin SDK is not initialized. Cannot save agent config.");
  }
  const docRef = adminDb.collection("agentConfig").doc(MAIN_CONFIG_DOC_ID);
  await docRef.set(config, { merge: true });
}
