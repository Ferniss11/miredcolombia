
'use server';

/**
 * @fileOverview An intelligent AI agent for generating comprehensive, well-researched, and visually appealing blog articles.
 * This flow generates the text content and suggests image search queries (hints).
 * A separate server function will enrich this output with actual image URLs.
 *
 * - generateIntelligentArticle - A function that generates a blog post using web search and suggests images.
 */

import {ai} from '@/ai/genkit';
import { webSearch } from '../tools/web-search';
import { unsplashSearch } from '../tools/unsplash-search';
import type { GenerateArticleInput, IntelligentArticle } from '@/lib/types';
import { GenerateArticleInputSchema, IntelligentArticleOutputSchema } from '@/lib/types';


export async function generateIntelligentArticle(input: GenerateArticleInput): Promise<IntelligentArticle> {
  return generateIntelligentArticleFlow(input);
}

// NOTE: The output schema still defines imageUrls, but the prompt instructs the AI
// to only fill the *Hint fields. The image URLs will be added by a separate process.
const prompt = ai.definePrompt({
  name: 'generateIntelligentArticlePrompt',
  input: {schema: GenerateArticleInputSchema},
  output: {schema: IntelligentArticleOutputSchema},
  tools: [webSearch, unsplashSearch],
  prompt: `Eres un experto creador de contenido y estratega de blogs para 'Colombia en España', una plataforma que ayuda a los colombianos a migrar y establecerse en España. Tu misión es generar un artículo completo, bien investigado y con sugerencias de imágenes.

**Instrucciones del Proceso:**

1.  **Investigación (Paso Obligatorio):**
    *   Comienza utilizando la herramienta \`webSearch\` para investigar a fondo el tema principal. Consulta la información más reciente y fiable.

2.  **Redacción y Estructura:**
    *   Basándote en tu investigación, escribe un artículo detallado y bien estructurado.
    *   Genera un **título** atractivo y optimizado para SEO.
    *   Escribe una **introducción** que enganche al lector.
    *   Divide el cuerpo del artículo en múltiples **secciones**, cada una con su propio encabezado y contenido.
    *   Escribe una **conclusión** sólida que resuma los puntos clave.
    *   Sugiere una lista de 3 a 5 **etiquetas** (tags) relevantes.

3.  **Sugerencia de Imágenes (Paso OBLIGATORIO):**
    *   Para la **imagen destacada** y para **CADA sección**, tu única tarea es decidir una **consulta de búsqueda de 2-3 palabras** para Unsplash.
    *   NO llames a la herramienta \`unsplashSearch\`.
    *   Coloca esta consulta de búsqueda en el campo \`featuredImageHint\` para la imagen principal, y en el campo \`imageHint\` para cada sección.
    *   DEJA EN BLANCO los campos \`featuredImageUrl\` y \`imageUrl\` de las secciones. Otro proceso se encargará de buscar las imágenes.

4.  **Formato de Salida:**
    *   Debes devolver el resultado final estrictamente en el formato JSON definido en el esquema de salida, recordando dejar los campos de URL de imagen en blanco.

**Detalles del Artículo a Generar:**
-   **Tema Principal:** {{{topic}}}
-   **Categoría:** {{{category}}}
-   **Tono Deseado:** {{{tone}}}
-   **Extensión Deseada:** {{{length}}}

Comienza el proceso ahora. Recuerda seguir todos los pasos. NO busques imágenes, solo proporciona las consultas de búsqueda en los campos 'Hint'.
`,
});

const generateIntelligentArticleFlow = ai.defineFlow(
  {
    name: 'generateIntelligentArticleFlow',
    inputSchema: GenerateArticleInputSchema,
    outputSchema: IntelligentArticleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
