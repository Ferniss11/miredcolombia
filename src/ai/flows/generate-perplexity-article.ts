
'use server';

/**
 * @fileOverview An AI agent that uses a web search tool to generate factual articles with citations.
 *
 * - generatePerplexityArticle - A function that generates a blog post emulating Perplexity's style.
 */

import {ai} from '@/ai/genkit';
import { webSearch } from '../tools/web-search';
import { GenerateArticleInputSchema, SimpleArticleOutputSchema, type GenerateArticleInput, type SimpleArticleOutput } from '@/lib/types';



export async function generatePerplexityArticle(input: GenerateArticleInput): Promise<SimpleArticleOutput> {
  return generatePerplexityArticleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePerplexityArticlePrompt',
  input: {schema: GenerateArticleInputSchema},
  output: {schema: SimpleArticleOutputSchema},
  tools: [webSearch],
  prompt: `Eres un motor de respuestas como Perplexity. Tu tarea es generar un artículo de blog preciso, bien estructurado y basado en hechos, utilizando la herramienta de búsqueda web para encontrar información actualizada y citar las fuentes.

**Instrucciones:**
1.  **Usa la herramienta de búsqueda:** Para el tema proporcionado, utiliza la herramienta 'webSearch' para encontrar información relevante y fiable.
2.  **Título:** Crea un título claro, informativo y directo para el artículo.
3.  **Contenido:** Escribe un artículo en formato Markdown. Organiza el contenido de forma lógica con encabezados (##), sub-encabezados (###), y listas. Basa tu redacción en los resultados de la búsqueda.
4.  **Cita fuentes:** Inserta citas numéricas (ej., [1], [2]) en el texto donde corresponda para respaldar la información, haciendo referencia a los resultados de la búsqueda que utilizaste.
5.  **Sección de Fuentes:** Al final del artículo, añade una sección titulada "## Fuentes" y lista las fuentes reales que encontraste y utilizaste (ej., "1. Título del Artículo - URL del sitio web").

**Detalles del Artículo:**
- **Tema Principal:** {{{topic}}}
- **Categoría:** {{{category}}}
- **Tono Deseado:** {{{tone}}} (aunque debe ser predominantemente informativo y factual)
- **Extensión Deseada:** {{{length}}}

Comienza a escribir el artículo ahora, usando la herramienta de búsqueda web, incluyendo el título y la sección de fuentes al final.
`,
});

const generatePerplexityArticleFlow = ai.defineFlow(
  {
    name: 'generatePerplexityArticleFlow',
    inputSchema: GenerateArticleInputSchema,
    outputSchema: SimpleArticleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
