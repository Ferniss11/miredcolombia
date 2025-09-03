'use server';
/**
 * @fileOverview An AI agent for generating complete email marketing sequences.
 *
 * - generateEmailSequence - A function that generates an email sequence from a prompt.
 */
import { ai } from '@/ai/genkit';
import { 
    GenerateEmailSequenceInputSchema, 
    GenerateEmailSequenceOutputSchema,
    type GenerateEmailSequenceInput,
    type GenerateEmailSequenceOutput 
} from '@/lib/types';


const prompt = ai.definePrompt({
  name: 'generateEmailSequencePrompt',
  input: { schema: GenerateEmailSequenceInputSchema },
  output: { schema: GenerateEmailSequenceOutputSchema },
  prompt: `Eres un experto en email marketing y copywriting para 'Mi Red Colombia', una plataforma que ayuda a colombianos en su proceso de migración a España.

Tu tarea es crear una secuencia de emails completa, lógica y efectiva, basada en los siguientes requisitos.

**Requisitos:**
1.  **Objetivo de la Secuencia:** {{{objective}}}
2.  **Número de Emails:** {{{numSteps}}}
3.  **Tono:** {{{tone}}}
4.  **Información Adicional a Incluir:** {{{additionalInfo}}}

**Instrucciones Obligatorias:**
-   **Nombre de la Secuencia:** Genera un nombre corto y descriptivo para la secuencia (ej. "Bienvenida Guía Empadronamiento").
-   **Disparador (Trigger):** Infiere el disparador más lógico ('on_guide_download', 'on_user_signup', 'on_service_purchase') basándote en el objetivo.
-   **Pasos (Steps):**
    -   Crea exactamente {{{numSteps}}} pasos.
    -   **Retraso (delayMinutes):** Asigna un retraso lógico en minutos para cada paso. El primer email puede ser inmediato (0 o 5 minutos), y los siguientes espaciados en días (1 día = 1440 mins, 2 días = 2880 mins).
    -   **Asunto (subject):** Escribe asuntos atractivos y relevantes para cada email.
    -   **Cuerpo (body):** Redacta el contenido de cada email en formato HTML. Utiliza párrafos (<p>), negritas (<strong>) y enlaces (<a>) si es necesario. Usa el placeholder {{firstName}} para el nombre del destinatario.
-   **Formato de Salida:** Debes devolver el resultado final estrictamente en el formato JSON definido en el esquema de salida.
`,
});

export async function generateEmailSequence(input: GenerateEmailSequenceInput): Promise<GenerateEmailSequenceOutput> {
    const { output } = await prompt(input, { model: input.model as any });
    if (!output) {
        throw new Error("AI did not return a sequence.");
    }
    return output;
}

const generateEmailSequenceFlow = ai.defineFlow(
  {
    name: 'generateEmailSequenceFlow',
    inputSchema: GenerateEmailSequenceInputSchema,
    outputSchema: GenerateEmailSequenceOutputSchema,
  },
  async (input) => {
    return await generateEmailSequence(input);
  }
);
