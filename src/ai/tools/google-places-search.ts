
'use server';

/**
 * @fileOverview Defines a Genkit tool for searching businesses using the Google Places API's searchText method.
 * This tool is optimized for finding places based on a text query like "Restaurant Name in City".
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Defines the structure for a single place returned by the search.
const PlaceSchema = z.object({
    id: z.string().describe('The unique Place ID from Google.'),
    displayName: z.string().describe('The name of the business.'),
    formattedAddress: z.string().describe('The full address of the business.'),
});

// Defines the structure for the raw JSON response, useful for debugging.
const RawApiResponseSchema = z.object({
    places: z.array(z.record(z.string(), z.any())).optional(),
});

export const googlePlacesSearch = ai.defineTool(
  {
    name: 'googlePlacesSearch',
    description: 'Searches for businesses on Google Maps using a text query (e.g., "Arepas El Sabor, Madrid"). Returns a list of matches with their Place IDs and the raw API response for debugging.',
    inputSchema: z.object({
      query: z.string().describe('The name and location of the business to search for. Example: "Arepas El Sabor en Madrid".'),
    }),
    outputSchema: z.object({
      places: z.array(PlaceSchema).describe('A list of businesses found on Google Maps.'),
      rawResponse: RawApiResponseSchema.describe('The raw, unprocessed JSON response from the Google Places API for debugging purposes.'),
    }),
  },
  async ({ query }) => {
    console.log(`[Google Places Tool] Searching for: "${query}"`);
    
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        const errorMsg = "[Google Places Tool] Error: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable not set.";
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    // Use the a more specific endpoint that is better for text-based searches.
    const apiUrl = 'https://places.googleapis.com/v1/places:searchText';
    // Define the fields we want to get back from the API.
    const fieldMask = 'places.id,places.displayName,places.formattedAddress';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': fieldMask,
            },
            // The body is simple: just the text query.
            body: JSON.stringify({ textQuery: query }),
        });
        
        const rawData = await response.json();

        if (!response.ok) {
            console.error(`[Google Places Tool] API error: ${response.statusText}`, rawData);
            throw new Error(`Failed to fetch data from Google Places API. Status: ${response.status}`);
        }
        
        // Sanitize the raw data before sending it back for debugging.
        const rawResponseForDebug: z.infer<typeof RawApiResponseSchema> = {
            places: rawData.places ? rawData.places.map((p: any) => ({...p})) : []
        };
        
        // Process the places for the main application logic.
        const places = (rawData.places || []).map((place: any) => ({
            id: place.id,
            displayName: place.displayName?.text || 'Nombre no disponible',
            formattedAddress: place.formattedAddress || 'Dirección no disponible',
        }));
        
        console.log(`[Google Places Tool] Found ${places.length} potential matches.`);
        return { places, rawResponse: rawResponseForDebug };

    } catch (error) {
        console.error("[Google Places Tool] Error calling API:", error);
        // In case of error, return empty results but still provide a debuggable response.
        return { places: [], rawResponse: { error: (error as Error).message } as any };
    }
  }
);
