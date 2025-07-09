'use server';

/**
 * @fileOverview An AI agent for generating blog content drafts based on a title.
 *
 * - generateBlogContent - A function that generates blog content.
 */

import {ai} from '@/ai/genkit';
import { GenerateBlogContentInputSchema, GenerateBlogContentOutputSchema, type GenerateBlogContentInput, type GenerateBlogContentOutput } from '@/lib/types';


export async function generateBlogContent(input: GenerateBlogContentInput): Promise<GenerateBlogContentOutput> {
  return generateBlogContentFlow(input);
}

const generateBlogContentPrompt = ai.definePrompt({
  name: 'generateBlogContentPrompt',
  input: {schema: GenerateBlogContentInputSchema},
  output: {schema: GenerateBlogContentOutputSchema},
  prompt: `Eres un experto redactor de contenido para blogs. Basado en el título proporcionado, genera una publicación de blog detallada y atractiva.

Título: {{{title}}}`,
});

const generateBlogContentFlow = ai.defineFlow(
  {
    name: 'generateBlogContentFlow',
    inputSchema: GenerateBlogContentInputSchema,
    outputSchema: GenerateBlogContentOutputSchema,
  },
  async input => {
    const {output} = await generateBlogContentPrompt(input);
    return output!;
  }
);
