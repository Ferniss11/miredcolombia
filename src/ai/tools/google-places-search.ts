
'use server';

/**
 * @fileOverview Defines a Genkit tool for searching businesses using the Google Places API.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const PlaceSchema = z.object({
    id: z.string().describe('The unique Place ID from Google.'),
    displayName: z.string().describe('The name of the business.'),
    formattedAddress: z.string().describe('The full address of the business.'),
});

export const googlePlacesSearch = ai.defineTool(
  {
    name: 'googlePlacesSearch',
    description: 'Searches for businesses on Google Maps and returns a list of potential matches with their Place IDs.',
    inputSchema: z.object({
      query: z.string().describe('The name and/or address of the business to search for. Example: "Arepas El Sabor, Madrid".'),
    }),
    outputSchema: z.object({
      places: z.array(PlaceSchema).describe('A list of businesses found on Google Maps.'),
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

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                // We want to get the ID, display name, and formatted address
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
            },
            body: JSON.stringify({ textQuery: query }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`[Google Places Tool] API error: ${response.statusText}`, errorData);
            throw new Error(`Failed to fetch data from Google Places API. Status: ${response.status}`);
        }

        const data = await response.json();
        const places = (data.places || []).map((place: any) => ({
            id: place.id,
            displayName: place.displayName?.text || 'Nombre no disponible',
            formattedAddress: place.formattedAddress || 'Dirección no disponible',
        }));
        
        console.log(`[Google Places Tool] Found ${places.length} potential matches.`);
        return { places };

    } catch (error) {
        console.error("[Google Places Tool] Error calling API:", error);
        return { places: [] };
    }
  }
);
