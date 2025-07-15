
'use server';

import { googlePlacesSearch } from "@/ai/tools/google-places-search";
import { adminDb, adminInstance } from "./firebase/admin-config";

const FieldValue = adminInstance?.firestore.FieldValue;

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
        // Use a more robust fetch with a user-agent to mimic a browser
        const response = await fetch(shortUrl, {
            method: 'GET',
            redirect: 'follow', // Let fetch handle the redirects automatically
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        // The final URL after all redirects
        if (!response.url) {
            throw new Error(`No se pudo resolver la URL corta: ${shortUrl}. La URL final no fue encontrada.`);
        }
        return response.url;
    } catch (e) {
        // This can happen due to network issues or if the URL isn't a valid redirect
        throw new Error(`Error al intentar resolver la URL corta: ${(e as Error).message}`);
    }
}


/**
 * Extracts a Google Place ID from a given string, which can be a full URL or just the ID.
 * Uses a robust regex to find Place IDs which always start with "ChI".
 * @param input - The string containing the Place ID.
 * @returns The extracted Place ID, or null if not found.
 */
function extractPlaceIdFromUrl(input: string): string | null {
    // This regex specifically looks for the Place ID format (starts with ChI...)
    // It's more reliable than trying to parse different URL structures.
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
        // Step 1: Check if the input is a short URL and resolve it.
        if (effectiveInput.startsWith('https://maps.app.goo.gl') || effectiveInput.startsWith('https://g.co/kgs') || effectiveInput.startsWith('https://share.google')) {
            const longUrl = await resolveShortUrl(effectiveInput);
            placeId = extractPlaceIdFromUrl(longUrl);
             if (!placeId) {
                throw new Error(`No se pudo extraer el Place ID de la URL resuelta: ${longUrl}`);
            }
        } else {
             // Step 2: For any other input (long URL or direct ID), just try to extract the ID.
             placeId = extractPlaceIdFromUrl(effectiveInput);
        }

        if (!placeId || !placeId.startsWith('ChI')) {
             // If no Place ID was found, it's an invalid input.
            return { success: false, error: `El ID de lugar o la URL no son válidos: "${placeIdOrUrl}"`, rawResponse: { error: "Invalid Place ID format or URL" } };
        }

        // Step 3: Fetch details from Google Places API.
        const fields = ['id', 'displayName', 'formattedAddress'];
        const apiUrl = `https://places.googleapis.com/v1/places/${placeId}`;
        const fieldMask = fields.join(',');

        const response = await fetch(apiUrl, {
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': fieldMask,
            }
        });
        
        const textResponse = await response.text();
        let rawResponse;
        try {
            rawResponse = JSON.parse(textResponse);
        } catch (e) {
             throw new Error(`Respuesta no válida de la API de Google: ${textResponse}`);
        }

        if (!response.ok) {
            throw new Error(`Google Places API error: ${JSON.stringify(rawResponse)}`);
        }

        // Remap the raw response to the format our UI expects
        const place = {
            id: rawResponse.id,
            displayName: rawResponse.displayName?.text || 'Nombre no disponible',
            formattedAddress: rawResponse.formattedAddress || 'Dirección no disponible',
        };
        
        return { success: true, places: [place], rawResponse };

    } catch (error) {
        console.error("Error in getBusinessDetailsAction:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage, rawResponse: { error: errorMessage, from: "getBusinessDetailsAction" } };
    }
}
