
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
    photoUrl: z.string().optional().describe('The URL of the primary photo for the business.'),
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
          // We add photos to the fields we want to retrieve
          fields: ['place_id', 'name', 'formatted_address', 'photos']
        }
      });

      const places = (response.data.results || []).map((place: any) => {
          let photoUrl;
          if (place.photos && place.photos[0] && place.photos[0].photo_reference) {
              photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`;
          }

          return {
              id: place.place_id!,
              displayName: place.name || 'Nombre no disponible',
              formattedAddress: place.vicinity || place.formatted_address || 'Dirección no disponible',
              photoUrl: photoUrl
          };
      });

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
