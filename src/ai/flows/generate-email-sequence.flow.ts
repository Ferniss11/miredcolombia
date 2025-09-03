'use server';
/**
 * @fileOverview An AI agent for generating complete email marketing sequences.
 *
 * - generateEmailSequence - A function that generates an email sequence from a prompt.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const SequenceTriggerSchema = z.enum(['on_guide_download', 'on_user_signup', 'on_service_purchase']);

export const GenerateEmailSequenceInputSchema = z.object({
  objective: z.string().describe('The main goal of the email sequence (e.g., "Welcome sequence for new users who downloaded the empadronamiento guide").'),
  numSteps: z.number().int().min(1).max(7).describe('The desired number of emails in the sequence.'),
  tone: z.enum(['Amigable', 'Formal', 'Persuasivo', 'Informativo']).describe('The desired tone of voice for the emails.'),
  additionalInfo: z.string().optional().describe('Any other key information or context to include in the emails (e.g., "Mention a 10% discount on our services in the last email").'),
  model: z.string().optional().describe("The AI model to use for generation.").default('googleai/gemini-1.5-pro-latest'),
});
export type GenerateEmailSequenceInput = z.infer<typeof GenerateEmailSequenceInputSchema>;


const EmailStepOutputSchema = z.object({
  id: z.string().default(() => uuidv4()).describe("A unique UUID for this step."),
  delayMinutes: z.coerce.number().describe('The delay in minutes from the previous step. The first step\'s delay is from the initial trigger.'),
  subject: z.string().describe('The subject line for this email.'),
  body: z.string().describe('The full HTML content of the email. Use standard HTML tags like <p>, <strong>, <a>. Use {{firstName}} for personalization.'),
});

export const GenerateEmailSequenceOutputSchema = z.object({
  name: z.string().describe('A descriptive internal name for the sequence.'),
  trigger: SequenceTriggerSchema.describe('The trigger event that should start this sequence.'),
  steps: z.array(EmailStepOutputSchema).describe('The array of email steps in the sequence.'),
  isActive: z.boolean().default(true),
});
export type GenerateEmailSequenceOutput = z.infer<typeof GenerateEmailSequenceOutputSchema>;


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

export async function generateEmailSequence(input: GenerateEmailSequenceInput) {
    const { output } = await prompt(input);
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
