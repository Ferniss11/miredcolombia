
'use server';

/**
 * @fileOverview An intelligent AI agent for generating comprehensive, well-researched, and visually appealing blog articles.
 *
 * - generateIntelligentArticle - A function that generates a blog post using web search and image search tools.
 */

import {ai} from '@/ai/genkit';
import { webSearch } from '../tools/web-search';
import { unsplashSearch } from '../tools/unsplash-search';
import type { GenerateArticleInput, IntelligentArticle } from '@/lib/types';
import { GenerateArticleInputSchema, IntelligentArticleOutputSchema } from '@/lib/types';


export async function generateIntelligentArticle(input: GenerateArticleInput): Promise<IntelligentArticle> {
  return generateIntelligentArticleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateIntelligentArticlePrompt',
  input: {schema: GenerateArticleInputSchema},
  output: {schema: IntelligentArticleOutputSchema},
  tools: [webSearch, unsplashSearch],
  prompt: `Eres un experto creador de contenido y estratega de blogs para 'Colombia en España', una plataforma que ayuda a los colombianos a migrar y establecerse en España. Tu misión es generar un artículo completo, bien investigado y visualmente atractivo.

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

3.  **Búsqueda de Imágenes (Paso Obligatorio):**
    *   **Imagen Destacada:** Primero, utiliza la herramienta \`unsplashSearch\` para encontrar UNA imagen principal (destacada) que represente el tema general del artículo. Elige una consulta de búsqueda de 2-3 palabras que resuma el tema. Del resultado, extrae la propiedad \`photoId\` y úsala de forma **LITERAL y SIN NINGUNA MODIFICACIÓN** para el campo \`featuredImageId\` en la salida. Guarda la consulta original en \`featuredImageHint\`.
    *   **Imágenes de Sección:** Para CADA sección que escribas, evalúa si una imagen mejoraría la comprensión. Si es así, usa la herramienta \`unsplashSearch\` NUEVAMENTE con una consulta de búsqueda muy específica y relevante para el contenido de ESA sección. Del resultado, extrae la propiedad \`photoId\` y úsala de forma **LITERAL y SIN NINGUNA MODIFICACIÓN** para el campo \`imageId\` de la sección. Si una sección no necesita imagen, omítela. Guarda la consulta original en \`imageHint\`.

4.  **Formato de Salida:**
    *   Debes devolver el resultado final estrictamente en el formato JSON definido en el esquema de salida.

**Detalles del Artículo a Generar:**
-   **Tema Principal:** {{{topic}}}
-   **Categoría:** {{{category}}}
-   **Tono Deseado:** {{{tone}}}
-   **Extensión Deseada:** {{{length}}}

Comienza el proceso ahora. Recuerda seguir todos los pasos, especialmente el uso de las herramientas de búsqueda web y de imágenes.
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
