
import {ai} from '@/ai/genkit';
import { webSearch } from '../tools/web-search';
import { unsplashSearch } from '../tools/unsplash-search';
import { GenerateArticleInput, IntelligentArticle } from '@/lib/types';
import { z } from 'zod';
import { GenerateArticleInputSchema, IntelligentArticleOutputSchema } from '@/lib/types';
import { calculateCost } from '@/lib/ai-costs';

// NOTE: The output schema still defines imageUrls, but the prompt instructs the AI
// to only fill the *Hint fields. The image URLs will be added by a separate process.
const prompt = ai.definePrompt({
  name: 'generateIntelligentArticlePrompt',
  input: {schema: GenerateArticleInputSchema},
  output: {schema: IntelligentArticleOutputSchema},
  tools: [webSearch, unsplashSearch],
  prompt: `Eres un experto creador de contenido y estratega de blogs para 'Mi Red Colombia', una plataforma que ayuda a los colombianos a migrar y establecerse en España. Tu misión es generar un artículo completo, bien investigado y con sugerencias de imágenes.

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

export const generateIntelligentArticleFlow = ai.defineFlow(
  {
    name: 'generateIntelligentArticleFlow',
    inputSchema: GenerateArticleInputSchema,
    // The flow now returns the article AND its generation cost
    outputSchema: z.object({
        article: IntelligentArticleOutputSchema,
        cost: z.number(),
    }),
  },
  async (input: GenerateArticleInput) => {
    const {output, usage} = await prompt(input, { model: input.model as any });
    if (!output) {
        throw new Error("AI did not return an article.");
    }
    
    // Calculate cost based on token usage
    const cost = calculateCost(
        input.model, // Use the passed model for cost calculation
        usage.inputTokens || 0,
        usage.outputTokens || 0
    );

    return { article: output, cost };
  }
);
