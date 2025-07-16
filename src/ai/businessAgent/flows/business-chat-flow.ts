
'use server';

/**
 * @fileOverview A specialized AI agent for handling conversations for individual businesses.
 * This flow is context-aware and uses tools to fetch specific business information.
 *
 * - businessChatFlow - The main flow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getBusinessInfoTool } from '../tools/get-business-info-tool';
import { ChatOutputSchema } from '@/lib/types';


// Define the input schema for the business chat flow
const BusinessChatFlowInputSchema = z.object({
  businessId: z.string().describe('The unique ID of the business.'),
  chatHistory: z.array(z.any()).describe('The history of the conversation so far.'),
  currentMessage: z.string().describe("The user's latest message."),
});
export type BusinessChatFlowInput = z.infer<typeof BusinessChatFlowInputSchema>;


/**
 * The main exported function to be called by server actions.
 * It triggers the Genkit flow.
 */
export async function businessChat(input: BusinessChatFlowInput) {
    return businessChatFlow(input);
}


const prompt = ai.definePrompt({
    name: 'businessChatPrompt',
    input: { schema: BusinessChatFlowInputSchema },
    output: { schema: ChatOutputSchema },
    tools: [getBusinessInfoTool],
    system: `
        ### CONTEXTO
        Eres un asistente de inteligencia artificial amigable y eficiente para un negocio específico. Tu misión es responder a las preguntas de los clientes basándote ÚNICAMENTE en la información proporcionada por tus herramientas.

        ### PROCESO DE RESPUESTA OBLIGATORIO
        1. **IDENTIFICAR NEGOCIO:** Al recibir una pregunta, utiliza la herramienta 'getBusinessInfoTool' con el businessId proporcionado para obtener los detalles del negocio sobre el que estás conversando. Esta es tu única fuente de conocimiento.
        2. **SÍNTESIS:** Basa tu respuesta estrictamente en los detalles devueltos por la herramienta (nombre, categoría, descripción, dirección, etc.).
        3. **RESPUESTA:** Si la herramienta devuelve información, preséntate como el asistente del negocio (ej. "¡Hola! Soy el asistente virtual de [Nombre del Negocio].") y responde a la pregunta del cliente. Si la herramienta no devuelve información, indica amablemente que no puedes encontrar los detalles de ese negocio en este momento.

        ### POLÍTICAS
        - NUNCA inventes información. Si no encuentras la respuesta en la información de la herramienta, indícalo.
        - Tu objetivo es ser útil, preciso y representar bien al negocio.
        - Utiliza un tono conversacional y profesional.
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

const businessChatFlow = ai.defineFlow(
    {
        name: 'businessChatFlow',
        inputSchema: BusinessChatFlowInputSchema,
        outputSchema: ChatOutputSchema,
    },
    async (input) => {
        // Here, we could add more logic before calling the prompt if needed.
        // For now, we pass the input directly to the prompt which will handle tool calling.
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
