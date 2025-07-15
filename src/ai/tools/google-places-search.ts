
'use server';

/**
 * @fileOverview Defines a Genkit tool for searching businesses using the Google Places API.
 * This tool now supports both specific text queries and more generic, location-based category searches.
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
    description: 'Searches for businesses on Google Maps. Can be used for specific queries (e.g., "Arepas El Sabor, Madrid") or generic category searches (e.g., query="Restaurante Colombiano", location="Madrid"). Returns a list of matches with their Place IDs.',
    inputSchema: z.object({
      query: z.string().describe('The name or category of the business to search for. Example: "Arepas El Sabor" or "Restaurante Colombiano".'),
      location: z.string().optional().describe('An optional location to restrict the search, like a city or region. Example: "Madrid".'),
    }),
    outputSchema: z.object({
      places: z.array(PlaceSchema).describe('A list of businesses found on Google Maps.'),
    }),
  },
  async ({ query, location }) => {
    // Combine query and location for a more precise search if location is provided.
    const textQuery = location ? `${query} en ${location}` : query;
    console.log(`[Google Places Tool] Searching for: "${textQuery}"`);
    
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
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
            },
            // The body now contains the combined text query.
            body: JSON.stringify({ textQuery: textQuery }),
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
