
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
 * Server Action to get detailed information for a business from Google Places API.
 * This is the "direct search" function.
 * @param placeId - The Google Place ID of the business.
 * @returns The full business details from Google.
 */
export async function getBusinessDetailsAction(placeId: string) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return { success: false, error: "Google API Key is not configured." };
    }

    const fields = [
        'id', 'displayName', 'formattedAddress', 'websiteUri',
        'nationalPhoneNumber', 'rating', 'userRatingCount', 'photos',
        'regularOpeningHours', 'location'
    ];
    // This is the correct endpoint for getting details by Place ID.
    const apiUrl = `https://places.googleapis.com/v1/places/${placeId}`;
    const fieldMask = fields.join(',');

    try {
        const response = await fetch(apiUrl, { 
            next: { revalidate: 3600 }, // Cache for 1 hour
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': fieldMask,
            }
        });
        
        const rawResponse = await response.json();

        if (!response.ok) {
            throw new Error(`Google Places API error: ${JSON.stringify(rawResponse)}`);
        }

        // Remap the raw response to the format our UI expects
        const place = {
            id: rawResponse.id,
            displayName: rawResponse.displayName?.text || 'Nombre no disponible',
            formattedAddress: rawResponse.formattedAddress || 'Dirección no disponible',
        }
        
        return { success: true, places: [place], rawResponse };

    } catch (error) {
        console.error("Error in getBusinessDetailsAction:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage, rawResponse: { error: errorMessage, from: "getBusinessDetailsAction" } };
    }
}
