
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
    error: z.string().optional(),
    status: z.number().optional(),
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
      rawResponse: z.any().describe('The raw, unprocessed response from the Google Places API for debugging purposes.'),
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

    const apiUrl = 'https://places.googleapis.com/v1/places:searchText';
    const fieldMask = 'places.id,places.displayName,places.formattedAddress';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': fieldMask,
            },
            body: JSON.stringify({ textQuery: query }),
        });
        
        const responseText = await response.text();
        let rawData;
        try {
            rawData = JSON.parse(responseText);
        } catch (e) {
            // If parsing fails, the response was not valid JSON. Return the raw text.
            console.error('[Google Places Tool] API response was not valid JSON:', responseText);
            throw new Error(`Invalid response from Google API (Status: ${response.status}): ${responseText}`);
        }

        if (!response.ok) {
            console.error(`[Google Places Tool] API error: ${response.statusText}`, rawData);
            throw new Error(`Failed to fetch data from Google Places API. Status: ${response.status}. Body: ${JSON.stringify(rawData)}`);
        }
        
        const places = (rawData.places || []).map((place: any) => ({
            id: place.id,
            displayName: place.displayName?.text || 'Nombre no disponible',
            formattedAddress: place.formattedAddress || 'Dirección no disponible',
        }));
        
        console.log(`[Google Places Tool] Found ${places.length} potential matches.`);
        return { places, rawResponse: rawData };

    } catch (error) {
        console.error("[Google Places Tool] Error calling API:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during the fetch operation.";
        // In case of error, return empty results but still provide a debuggable response.
        return { places: [], rawResponse: { error: errorMessage } };
    }
  }
);
