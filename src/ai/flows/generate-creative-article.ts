
'use server';

/**
 * @fileOverview An AI agent for generating creative blog articles.
 *
 * - generateCreativeArticle - A function that generates a blog post with a creative style.
 */

import {ai} from '@/ai/genkit';
import { GenerateArticleInputSchema, SimpleArticleOutputSchema, type GenerateArticleInput, type SimpleArticleOutput } from '@/lib/types';


export async function generateCreativeArticle(input: GenerateArticleInput): Promise<SimpleArticleOutput> {
  return generateCreativeArticleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCreativeArticlePrompt',
  input: {schema: GenerateArticleInputSchema},
  output: {schema: SimpleArticleOutputSchema},
  prompt: `Eres un experto redactor de contenido para blogs y un talentoso narrador. Tu misión es generar una publicación de blog detallada, atractiva y creativa.

**Instrucciones:**
1.  **Título:** Crea un título cautivador y optimizado para SEO basado en el tema.
2.  **Contenido:** Escribe un artículo bien estructurado en formato Markdown. Utiliza encabezados (##), listas y negritas para mejorar la legibilidad.
3.  **Estilo:** Adopta un enfoque narrativo y creativo. Usa un lenguaje vívido y cercano para conectar con el lector.

**Detalles del Artículo:**
- **Tema Principal:** {{{topic}}}
- **Categoría:** {{{category}}}
- **Tono Deseado:** {{{tone}}}
- **Extensión Deseada:** {{{length}}}

Comienza a escribir el artículo ahora.
`,
});

const generateCreativeArticleFlow = ai.defineFlow(
  {
    name: 'generateCreativeArticleFlow',
    inputSchema: GenerateArticleInputSchema,
    outputSchema: SimpleArticleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
