
/**
 * @fileOverview Defines a Genkit tool for searching images on Unsplash.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const unsplashSearch = ai.defineTool(
  {
    name: 'unsplashSearch',
    description: 'Searches for a relevant, high-quality, and royalty-free image on Unsplash and returns its unique Photo ID. Use this to find images for blog posts.',
    inputSchema: z.object({
      query: z.string().describe('A 2-3 word descriptive search query for the desired image. Be specific. Example: "legal documents spain", "madrid city apartment", "friendly meeting cafe".'),
    }),
    outputSchema: z.object({
      photoId: z.string().describe("The unique ID of the found image on Unsplash (e.g., 'f4p_n1Tj4_c'). This ID is NOT a URL."),
      imageHint: z.string().describe("The original query used to find the image, to be used as a hint for alt text."),
    }),
  },
  async ({ query }) => {
    console.log(`[Unsplash Search Tool] Searching for: ${query}`);
    
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
        const errorMsg = "[Unsplash Search Tool] Error: UNSPLASH_ACCESS_KEY environment variable not set.";
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    try {
        const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
            headers: {
                Authorization: `Client-ID ${accessKey}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`[Unsplash Search Tool] API error: ${response.statusText}`, errorData);
            throw new Error(`Failed to fetch image from Unsplash. Status: ${response.status}`);
        }

        const data = await response.json();
        const result = data.results?.[0];

        if (!result) {
            console.warn(`[Unsplash Search Tool] No image found on Unsplash for query: "${query}". Returning a placeholder ID.`);
            return {
                photoId: 'placeholder',
                imageHint: query,
            };
        }
        
        const photoId = result.id;
        console.log(`[Unsplash Search Tool] Found photo ID: ${photoId}`);

        return {
            photoId: photoId,
            imageHint: query,
        };
    } catch (error) {
        console.error("[Unsplash Search Tool] Error calling Unsplash API:", error);
        return {
            photoId: `placeholder`,
            imageHint: query,
        };
    }
  }
);
