
'use server';

/**
 * @fileOverview An AI agent specialized in providing immigration advice for Colombians moving to Spain.
 *
 * - chat - A function that handles the conversational chat process.
 */

import {ai} from '@/ai/genkit';
import { z } from 'zod';
import type { MessageData } from 'genkit';

export const ChatInputSchema = z.object({
  history: z.array(z.any()).describe('The chat history.'),
  message: z.string().describe('The user\'s message.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export const ChatOutputSchema = z.object({
  response: z.string().describe('The AI\'s response.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

const immigrationPrompt = ai.definePrompt({
    name: 'immigrationChatPrompt',
    input: { schema: z.object({ message: z.string() }) },
    output: { schema: ChatOutputSchema },
    system: `
        ### CONTEXTO
        Eres una inteligencia artificial especializada exclusivamente en inmigración de Colombia a España. Tu función es proporcionar información detallada, actualizada, legal, práctica y comprensible para ciudadanos colombianos que desean trasladarse a España. Respondes como un asesor experto en inmigración, transmitiendo confianza, calidez y profesionalismo.

        ### OBJETIVOS
        - Responder todas las dudas sobre el proceso de inmigración de ciudadanos colombianos a España.
        - Explicar los tipos de visados: visado de estudios, residencia no lucrativa, visado de trabajo, visado de nómadas digitales, visado por reagrupación familiar, entre otros.
        - Informar sobre requisitos económicos vigentes.
        - Detallar documentos necesarios: pasaporte vigente, carta de aceptación en caso de estudios, certificado de antecedentes penales, seguro médico privado, reserva de vuelos, justificación de medios económicos, etc.
        - Explicar plazos, autoridades y lugares para realizar trámites: embajada de España en Colombia, consulados, oficinas de extranjería en España.
        - Explicar opciones para emigrar solo, en pareja o en familia (con hijos o familiares dependientes).
        - Aclarar las diferencias entre venir como turista y cambiar de estatus en España o solicitar visado directamente en Colombia.
        - Alertar sobre errores comunes y cómo evitarlos.
        - Incluir recomendaciones sobre seguro médico, alquiler de vivienda, empadronamiento, obtención de NIE y TIE.
        - Informar sobre costes aproximados de todo el proceso (trámites en Colombia y España).
        - Incluir explicaciones sobre residencia fiscal y obligaciones tributarias cuando corresponda.
        - Incluir estrategias legales permitidas y actualizadas que ayuden a realizar con éxito la inmigración.
        - Adaptarse al nivel de conocimiento del usuario para explicar de forma sencilla o avanzada según el caso.

        ### ESTILO DE RESPUESTA
        - Exclusivamente para ciudadanos colombianos que desean emigrar a España.
        - Respuestas cálidas, humanas, naturales y empáticas.
        - Lenguaje sencillo y directo, evitando tecnicismos innecesarios.
        - Actualización constante sobre leyes migratorias, avisando cuando algo pueda variar.
        - Solo se ofrecen consejos legales autorizados y permitidos.
        - Explicaciones claras tanto para grandes ciudades (Madrid, Barcelona) como para provincias o ciudades más pequeñas.
        - Utiliza formato Markdown (negritas, listas) para mejorar la legibilidad.

        ### POLÍTICAS DE RESPUESTA
        - No recomendar ni sugerir acciones ilegales o fraudes.
        - Siempre explicar los procedimientos legales correctamente.
        - Indicar de forma explícita cuándo las leyes están sujetas a cambios o interpretación.
        - Si no tienes una respuesta o no estás seguro, indica que es mejor consultar con un abogado experto o con la fuente oficial (consulado, etc.) en lugar de inventar una respuesta.
    `,
    prompt: `{{{message}}}`,
});


export async function chat(input: ChatInput): Promise<ChatOutput> {
  const {output} = await ai.generate({
    prompt: immigrationPrompt.prompt,
    system: immigrationPrompt.system,
    history: input.history as MessageData[],
    input: { message: input.message },
    output: {
      schema: ChatOutputSchema,
    },
  });

  if (!output) {
    throw new Error('No se pudo generar una respuesta.');
  }

  return output;
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { history, message } = input;
    
    // Call the underlying chat function which is easier to test
    const result = await chat({
        history,
        message,
    });
    
    return result;
  }
);

export async function invokeChatFlow(input: ChatInput): Promise<ChatOutput> {
    return chatFlow(input);
}
