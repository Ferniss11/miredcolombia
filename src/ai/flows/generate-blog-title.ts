'use server';

/**
 * @fileOverview AI-powered blog title generation.
 *
 * - generateBlogTitle - Generates a blog title based on a topic or description.
 */

import {ai} from '@/ai/genkit';
import { GenerateBlogTitleInputSchema, GenerateBlogTitleOutputSchema, type GenerateBlogTitleInput, type GenerateBlogTitleOutput } from '@/lib/types';


export async function generateBlogTitle(input: GenerateBlogTitleInput): Promise<GenerateBlogTitleOutput> {
  return generateBlogTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBlogTitlePrompt',
  input: {schema: GenerateBlogTitleInputSchema},
  output: {schema: GenerateBlogTitleOutputSchema},
  prompt: `Eres un experto generador de títulos de blog. Genera un título de publicación de blog atractivo basado en el tema o la descripción proporcionada.\n\nTema/Descripción: {{{topic}}}\n\nTítulo Generado:`,
});

const generateBlogTitleFlow = ai.defineFlow(
  {
    name: 'generateBlogTitleFlow',
    inputSchema: GenerateBlogTitleInputSchema,
    outputSchema: GenerateBlogTitleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
