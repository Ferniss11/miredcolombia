'use server';

/**
 * @fileOverview Generates blog content ideas for the platform.
 *
 * - generateBlogIdeas - A function that generates blog content ideas.
 */

import {ai} from '@/ai/genkit';
import { GenerateBlogIdeasInputSchema, GenerateBlogIdeasOutputSchema, type GenerateBlogIdeasInput, type GenerateBlogIdeasOutput } from '@/lib/types';


export async function generateBlogIdeas(input: GenerateBlogIdeasInput): Promise<GenerateBlogIdeasOutput> {
  return generateBlogIdeasFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBlogIdeasPrompt',
  input: {schema: GenerateBlogIdeasInputSchema},
  output: {schema: GenerateBlogIdeasOutputSchema},
  prompt: `Eres un experto en creación de contenido para un blog.

Generarás {{numIdeas}} ideas de publicaciones para un blog comunitario.

La comunidad se describe como: {{{communityDescription}}}

Las siguientes palabras clave son relevantes para la comunidad: {{{keywords}}}

Ideas para Publicaciones de Blog:`,
});

const generateBlogIdeasFlow = ai.defineFlow(
  {
    name: 'generateBlogIdeasFlow',
    inputSchema: GenerateBlogIdeasInputSchema,
    outputSchema: GenerateBlogIdeasOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      ideas: output!.ideas,
    };
  }
);
