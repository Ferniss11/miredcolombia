
/**
 * @fileOverview Defines a Genkit tool for performing web searches.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SearchResultSchema = z.object({
  title: z.string().describe('The title of the search result.'),
  link: z.string().describe('The URL of the search result.'),
  snippet: z.string().describe('A brief snippet or summary of the content.'),
});

export const webSearch = ai.defineTool(
  {
    name: 'webSearch',
    description: 'Performs a web search for a given query and returns a list of relevant results. Use this to find up-to-date information on any topic.',
    inputSchema: z.object({
      query: z.string().describe('The search query.'),
    }),
    outputSchema: z.object({
      results: z.array(SearchResultSchema).describe('A list of search results.'),
    }),
  },
  async (input) => {
    console.log(`[Web Search Tool] Performing real search for: ${input.query}`);
    
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      console.error("Serper API key is not set. Returning empty search results.");
      return { results: [] };
    }

    try {
        const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ q: input.query }),
        });

        if (!response.ok) {
            console.error(`Serper API error: ${response.statusText}`);
            throw new Error('Failed to fetch search results from Serper.');
        }

        const data = await response.json();
        
        const results = (data.organic || []).map((item: any) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
        }));

        return { results };

    } catch (error) {
        console.error("Error calling Serper API:", error);
        return { results: [] };
    }
  }
);
