
'use server';

/**
 * @fileOverview Defines a Genkit tool for searching businesses using the Google Maps Platform client library.
 * This provides a more robust way to interact with the Google Places API.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Client } from '@googlemaps/google-maps-services-js';

const googleMapsClient = new Client({});

// Defines the structure for a single place returned by the search.
const PlaceSchema = z.object({
    id: z.string().describe('The unique Place ID from Google.'),
    displayName: z.string().describe('The name of the business.'),
    formattedAddress: z.string().describe('The full address of the business.'),
});

export const googlePlacesSearch = ai.defineTool(
  {
    name: 'googlePlacesSearch',
    description: 'Searches for businesses on Google Maps using a text query (e.g., "Restaurantes en Madrid"). Returns a list of matches with their Place IDs and the raw API response for debugging.',
    inputSchema: z.object({
      query: z.string().describe('The category and location to search for. Example: "Restaurantes Colombianos en Madrid".'),
    }),
    outputSchema: z.object({
      places: z.array(PlaceSchema).describe('A list of businesses found on Google Maps.'),
      rawResponse: z.any().describe('The raw, unprocessed response from the Google Places API for debugging purposes.'),
    }),
  },
  async ({ query }) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        const errorMsg = "[Google Places Tool] Error: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable not set.";
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
    
    try {
      const response = await googleMapsClient.textSearch({
        params: {
          query,
          key: apiKey,
        }
      });

      const places = (response.data.results || []).map((place: any) => ({
          id: place.place_id!,
          displayName: place.name || 'Nombre no disponible',
          formattedAddress: place.vicinity || 'Dirección no disponible',
      }));

      return { places, rawResponse: response.data };

    } catch (error: any) {
        console.error("[Google Places Tool] Error calling API:", error?.response?.data || error.message);
        const errorMessage = error?.response?.data?.error_message || error.message || "An unknown error occurred during the fetch operation.";
        return { 
            places: [], 
            rawResponse: { 
                error: errorMessage, 
                status: error?.response?.data?.status, 
                details: error?.response?.data 
            } 
        };
    }
  }
);
