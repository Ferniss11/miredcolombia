
'use server';

/**
 * @fileOverview Defines a Genkit tool for searching businesses using the Google Places API.
 * This tool now uses a two-step process for text searches:
 * 1. Geocoding API to get coordinates for a location.
 * 2. Places API (Nearby Search) to find places of a certain type near those coordinates.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

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
    console.log(`[Google Places Tool V2] Searching for: "${query}"`);
    
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        const errorMsg = "[Google Places Tool] Error: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable not set.";
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    try {
        // Step 1: Geocode the location part of the query to get lat/lng
        // A simple regex to separate the "what" from the "where"
        const match = query.match(/(.+)\s+en\s+(.+)/i);
        let textQuery = query;
        let locationQuery = '';

        if (match && match.length === 3) {
            textQuery = match[1];
            locationQuery = match[2];
        } else {
             // If no "en" is found, assume the whole query is the business name
             // and we can use the original searchText method.
             return await searchTextFallback(query, apiKey);
        }

        const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationQuery)}&key=${apiKey}`;
        const geocodingResponse = await fetch(geocodingUrl);
        const geocodingData = await geocodingResponse.json();

        if (geocodingData.status !== 'OK' || !geocodingData.results[0]) {
            throw new Error(`No se pudo geolocalizar la ubicación: ${locationQuery}. Estado: ${geocodingData.status}`);
        }

        const { lat, lng } = geocodingData.results[0].geometry.location;
        console.log(`[Google Places Tool V2] Geocoded "${locationQuery}" to: ${lat}, ${lng}`);

        // Step 2: Use Nearby Search with the geocoded location
        const nearbySearchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&keyword=${encodeURIComponent(textQuery)}&key=${apiKey}`;
        
        const nearbyResponse = await fetch(nearbySearchUrl);
        const nearbyData = await nearbyResponse.json();

        if (nearbyData.status !== 'OK' && nearbyData.status !== 'ZERO_RESULTS') {
            throw new Error(`Error en la API de Nearby Search: ${nearbyData.status} - ${nearbyData.error_message || ''}`);
        }

        const places = (nearbyData.results || []).map((place: any) => ({
            id: place.place_id,
            displayName: place.name || 'Nombre no disponible',
            formattedAddress: place.vicinity || 'Dirección no disponible',
        }));

        console.log(`[Google Places Tool V2] Found ${places.length} potential matches.`);
        return { places, rawResponse: nearbyData };

    } catch (error) {
        console.error("[Google Places Tool V2] Error calling API:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during the fetch operation.";
        return { places: [], rawResponse: { error: errorMessage } };
    }
  }
);


// Fallback to the original searchText method if the query doesn't fit the new pattern
async function searchTextFallback(query: string, apiKey: string) {
    const apiUrl = 'https://places.googleapis.com/v1/places:searchText';
    const fieldMask = 'places.id,places.displayName,places.formattedAddress';

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': fieldMask,
        },
        body: JSON.stringify({ textQuery: query }),
    });
    
    const textResponse = await response.text();
    let rawData;
    try {
        rawData = JSON.parse(textResponse);
    } catch (e) {
        throw new Error(`Invalid response from Google API (Status: ${response.status}): ${textResponse}`);
    }

    if (!response.ok) {
        throw new Error(`Failed to fetch data from Google Places API. Status: ${response.status}. Body: ${JSON.stringify(rawData)}`);
    }
    
    const places = (rawData.places || []).map((place: any) => ({
        id: place.id,
        displayName: place.displayName?.text || 'Nombre no disponible',
        formattedAddress: place.formattedAddress || 'Dirección no disponible',
    }));
    
    return { places, rawResponse: rawData };
}
