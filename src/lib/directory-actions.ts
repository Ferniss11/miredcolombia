
'use server';

import { googlePlacesSearch } from "@/ai/tools/google-places-search";
import { adminDb, adminInstance } from "./firebase/admin-config";
import { Client } from "@googlemaps/google-maps-services-js";

const FieldValue = adminInstance?.firestore.FieldValue;
const googleMapsClient = new Client({});

function getDbInstance() {
    if (!adminDb) {
        throw new Error("Firebase Admin SDK is not initialized. Directory service is unavailable.");
    }
    return adminDb;
}

/**
 * Server Action to search for businesses using the Google Places Genkit tool.
 * @param query - The search query (e.g., "Business Name, City").
 * @returns An object containing the list of places and the raw API response for debugging.
 */
export async function searchBusinessesOnGoogleAction(query: string) {
    try {
        const result = await googlePlacesSearch({ query });
        return { 
            success: true, 
            places: result.places,
            rawResponse: result.rawResponse // Pass the raw response to the client
        };
    } catch (error) {
        console.error("Error in searchBusinessesOnGoogleAction:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { 
            success: false, 
            error: errorMessage,
            rawResponse: { error: errorMessage, from: "Action" } // Pass error in raw response format
        };
    }
}

/**
 * Server Action to save a new business to the directory in Firestore.
 * It only stores the Place ID and a category.
 * @param placeId - The Google Place ID of the business.
 * @param category - The category assigned by the admin.
 * @returns An object indicating success or failure.
 */
export async function saveBusinessAction(placeId: string, category: string) {
    const db = getDbInstance();
     if (!FieldValue) throw new Error("Firebase Admin SDK is not fully initialized.");
    try {
        const businessRef = db.collection('directory').doc(placeId);
        
        // Check if the business already exists
        const docSnap = await businessRef.get();
        if (docSnap.exists) {
            return { success: false, error: "Este negocio ya ha sido añadido al directorio." };
        }

        await businessRef.set({
            placeId: placeId,
            category: category,
            createdAt: FieldValue.serverTimestamp(),
            source: 'AdminGratuito' // Indicates it was added manually by an admin for free
        });

        return { success: true, message: "Negocio añadido al directorio." };
    } catch (error) {
        console.error("Error in saveBusinessAction:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

/**
 * Follows a short Google URL (like share.google or maps.app.goo.gl) to find the long URL.
 * @param shortUrl - The short URL to resolve.
 * @returns The resolved long URL.
 */
async function resolveShortUrl(shortUrl: string): Promise<string> {
    try {
        // Using 'HEAD' can be faster as it doesn't download the body
        const response = await fetch(shortUrl, {
            redirect: 'follow', // follow redirects
        });
        if (!response.url) {
            throw new Error(`No se pudo resolver la URL corta: ${shortUrl}. La URL final no fue encontrada.`);
        }
        return response.url;
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        throw new Error(`Error al intentar resolver la URL corta: ${errorMessage}`);
    }
}


/**
 * Extracts a Google Place ID from a given string, which can be a full URL or just the ID.
 * Uses a robust regex to find Place IDs which always start with "ChI".
 * @param input - The string containing the Place ID.
 * @returns The extracted Place ID, or null if not found.
 */
function extractPlaceIdFromUrl(input: string): string | null {
    // This regex specifically looks for the "ChIJ..." pattern which is unique to Place IDs
    const placeIdRegex = /(ChI[a-zA-Z0-9_-]{25,})/;
    const match = input.match(placeIdRegex);
    return match ? match[0] : null;
}


/**
 * Server Action to get detailed information for a business from Google Places API.
 * This function now handles direct Place IDs, long URLs, and short URLs.
 * @param placeIdOrUrl - The Google Place ID or URL of the business.
 * @returns The full business details from Google.
 */
export async function getBusinessDetailsAction(placeIdOrUrl: string) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return { success: false, error: "Google API Key is not configured." };
    }

    let placeId: string | null = null;
    let effectiveInput = placeIdOrUrl.trim();

    try {
        let finalUrl = effectiveInput;
        if (effectiveInput.startsWith('http')) {
             finalUrl = await resolveShortUrl(effectiveInput);
        }

        placeId = extractPlaceIdFromUrl(finalUrl);

        if (!placeId) {
            throw new Error(`No se pudo extraer un Place ID válido de la entrada proporcionada o de la URL resuelta: ${finalUrl}`);
        }

        const response = await googleMapsClient.placeDetails({
            params: {
                place_id: placeId,
                fields: ['place_id', 'name', 'vicinity'],
                key: apiKey,
            }
        });

        if (response.data.status !== 'OK') {
             throw new Error(`Google Places API error: ${response.data.status} - ${response.data.error_message || ''}`);
        }

        const result = response.data.result;
        const place = {
            id: result.place_id!,
            displayName: result.name || 'Nombre no disponible',
            formattedAddress: result.vicinity || 'Dirección no disponible',
        };
        
        return { success: true, places: [place], rawResponse: response.data };

    } catch (error: any) {
        console.error("Error in getBusinessDetailsAction:", error);
        const errorMessage = error?.response?.data?.error_message || error.message || "An unknown error occurred.";
        return { 
            success: false, 
            error: errorMessage, 
            rawResponse: { 
                error: errorMessage, 
                from: "getBusinessDetailsAction",
                status: error?.response?.data?.status, 
                details: error?.response?.data 
            } 
        };
    }
}
