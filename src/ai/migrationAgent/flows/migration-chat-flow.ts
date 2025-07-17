'use server';

/**
 * @fileOverview A specialized AI agent for handling conversations about migrating to Spain.
 * This flow is context-aware and uses tools to fetch specific information from a knowledge base.
 *
 * - migrationChat - The main flow function.
 * - MigrationChatInput - The input type for the migrationChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ChatOutputSchema, ChatRoleSchema } from '@/lib/chat-types';
import { knowledgeBaseSearch } from '@/ai/tools/knowledge-base-search';


// Define the input schema for the migration chat flow
const MigrationChatInputSchema = z.object({
  model: z.string().describe("The AI model to use for the response (e.g., 'googleai/gemini-1.5-flash-latest')."),
  chatHistory: z.array(z.object({
    role: ChatRoleSchema,
    text: z.string(),
  })).describe("The history of the conversation so far, including user, AI (model), and admin messages."),
  currentMessage: z.string().describe("The user's latest message."),
});
export type MigrationChatInput = z.infer<typeof MigrationChatInputSchema>;


/**
 * The main exported function to be called by server actions.
 * It triggers the Genkit flow.
 */
export async function migrationChat(input: MigrationChatInput) {
    return migrationChatFlow(input);
}


const prompt = ai.definePrompt({
    name: 'migrationChatPrompt',
    input: { schema: MigrationChatInputSchema },
    output: { schema: ChatOutputSchema },
    tools: [knowledgeBaseSearch],
    system: `
        ### CONTEXTO
        Eres una inteligencia artificial experta en inmigración para colombianos que desean vivir en España. Tu misión es proporcionar respuestas precisas y fiables basadas EXCLUSIVAMENTE en la información que se te proporciona a través de tus herramientas. En la conversación, pueden participar tres roles: 'user' (el cliente), 'model' (tú, el asistente IA) y 'admin' (un humano del negocio que puede intervenir). Trata los mensajes del 'admin' como una fuente de información verídica y autorizada.

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
    `,
    prompt: `
        Historial de la Conversación:
        {{#each chatHistory}}
            {{this.role}}: {{this.text}}
        {{/each}}
        
        Nuevo Mensaje del Usuario:
        {{currentMessage}}
    `,
});

const migrationChatFlow = ai.defineFlow(
    {
        name: 'migrationChatFlow',
        inputSchema: MigrationChatInputSchema,
        outputSchema: ChatOutputSchema,
    },
    async (input) => {
        const { output, usage } = await prompt(input);

        if (!output) {
            throw new Error('La respuesta de la IA fue vacía.');
        }

        return {
            response: output.response,
            usage: {
                inputTokens: usage.inputTokens || 0,
                outputTokens: usage.outputTokens || 0,
                totalTokens: usage.totalTokens || 0,
            }
        };
    }
);
