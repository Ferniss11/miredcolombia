
'use server';

/**
 * @fileOverview An AI agent for generating factual and analytical blog articles.
 *
 * - generateFactualArticle - A function that generates a blog post with an analytical style.
 */

import {ai} from '@/ai/genkit';
import { GenerateArticleInputSchema, SimpleArticleOutputSchema, type GenerateArticleInput, type SimpleArticleOutput } from '@/lib/types';


export async function generateFactualArticle(input: GenerateArticleInput): Promise<SimpleArticleOutput> {
  return generateFactualArticleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFactualArticlePrompt',
  input: {schema: GenerateArticleInputSchema},
  output: {schema: SimpleArticleOutputSchema},
  prompt: `Eres un analista experto y un redactor técnico. Tu tarea es generar un artículo de blog preciso, bien estructurado y basado en hechos, como si fueras un experto en la materia.

**Instrucciones:**
1.  **Simula una búsqueda en internet:** Actúa como si hubieras consultado múltiples fuentes fiables (sitios web gubernamentales, noticias, documentos oficiales) para obtener la información más reciente y precisa sobre el tema.
2.  **Título:** Crea un título claro, informativo y directo.
3.  **Contenido:** Escribe un artículo en formato Markdown. Organiza el contenido de forma lógica con encabezados (##), sub-encabezados (###), listas con viñetas o numeradas. Céntrate en los datos, los pasos y la información práctica.
4.  **Estilo:** Usa un lenguaje formal, claro y conciso. Evita la jerga innecesaria, pero sé preciso.

**Detalles del Artículo:**
- **Tema Principal:** {{{topic}}}
- **Categoría:** {{{category}}}
- **Tono Deseado:** {{{tone}}}
- **Extensión Deseada:** {{{length}}}

Comienza a escribir el artículo ahora.
`,
});

const generateFactualArticleFlow = ai.defineFlow(
  {
    name: 'generateFactualArticleFlow',
    inputSchema: GenerateArticleInputSchema,
    outputSchema: SimpleArticleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
