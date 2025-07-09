
/**
 * @fileOverview Defines a Genkit tool for searching images on Unsplash.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const unsplashSearch = ai.defineTool(
  {
    name: 'unsplashSearch',
    description: 'Searches for a relevant, high-quality, and royalty-free image on Unsplash and returns its URL. Use this to find images for blog posts.',
    inputSchema: z.object({
      query: z.string().describe('A 2-3 word descriptive search query for the desired image. Be specific. Example: "legal documents spain", "madrid city apartment", "friendly meeting cafe".'),
    }),
    outputSchema: z.object({
      imageUrl: z.string().url().describe("The URL of the found image on Unsplash."),
      imageHint: z.string().describe("The original query used to find the image, to be used as a hint for alt text."),
    }),
  },
  async ({ query }) => {
    console.log(`[Unsplash Search Tool] Searching for: ${query}`);
    
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
        console.error("Unsplash API key is not set. Returning placeholder.");
        return {
            imageUrl: `https://placehold.co/1200x600.png`,
            imageHint: query,
        };
    }

    try {
        const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
            headers: {
                Authorization: `Client-ID ${accessKey}`,
            },
        });

        if (!response.ok) {
            console.error(`Unsplash API error: ${response.statusText}`);
            throw new Error('Failed to fetch image from Unsplash.');
        }

        const data = await response.json();
        console.log('[Unsplash Search Tool] API Response:', JSON.stringify(data, null, 2));

        const imageUrlBase = data.results?.[0]?.urls?.full;

        if (!imageUrlBase) {
            console.warn(`No image found on Unsplash for query: "${query}".`);
            return {
                imageUrl: `https://placehold.co/1200x600.png`,
                imageHint: query,
            };
        }
        
        // Append parameters to ensure the URL is valid and optimized
        const finalImageUrl = `${imageUrlBase}&w=1200&fit=max`;

        return {
            imageUrl: finalImageUrl,
            imageHint: query,
        };
    } catch (error) {
        console.error("Error calling Unsplash API:", error);
        return {
            imageUrl: `https://placehold.co/1200x600.png`,
            imageHint: query,
        };
    }
  }
);
