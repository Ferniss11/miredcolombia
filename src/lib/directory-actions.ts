
'use server';

import { googlePlacesSearch } from "@/ai/tools/google-places-search";
import { adminDb, adminInstance } from "./firebase/admin-config";
import { revalidatePath } from "next/cache";
import type { PlaceDetails } from "./types";
import { Client } from '@googlemaps/google-maps-services-js';

const googleMapsClient = new Client({});
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
            rawResponse: result.rawResponse
        };
    } catch (error) {
        console.error("Error in searchBusinessesOnGoogleAction:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { 
            success: false, 
            error: errorMessage,
            rawResponse: { error: errorMessage, from: "Action" }
        };
    }
}

/**
 * Server Action to save a new business to the directory in Firestore.
 * @param placeId - The Google Place ID of the business.
 * @param category - The category assigned by the admin.
 * @returns An object indicating success or failure.
 */
export async function saveBusinessAction(placeId: string, category: string) {
    const db = getDbInstance();
     if (!FieldValue) throw new Error("Firebase Admin SDK is not fully initialized.");
    try {
        const businessRef = db.collection('directory').doc(placeId);
        
        const docSnap = await businessRef.get();
        if (docSnap.exists) {
            return { success: false, error: "Este negocio ya ha sido añadido al directorio." };
        }

        await businessRef.set({
            placeId: placeId,
            category: category,
            createdAt: FieldValue.serverTimestamp(),
            source: 'AdminGratuito'
        });

        revalidatePath('/dashboard/admin/directory');
        return { success: true, message: "Negocio añadido al directorio." };
    } catch (error) {
        console.error("Error in saveBusinessAction:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

/**
 * Fetches details for a single place ID from Google Places API.
 * @param placeId The Place ID to look up.
 * @returns The place details or null if not found.
 */
async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable not set.");
    }
    try {
        const response = await googleMapsClient.placeDetails({
            params: {
                place_id: placeId,
                fields: ['name', 'formatted_address', 'place_id', 'types'],
                key: apiKey,
            }
        });

        if (response.data.status === 'OK') {
            const result = response.data.result;
            return {
                id: result.place_id!,
                displayName: result.name || 'Nombre no disponible',
                formattedAddress: result.formatted_address || 'Dirección no disponible',
                category: result.types?.[0] || 'General'
            };
        }
        return null;
    } catch (error) {
        console.error(`Error fetching details for placeId ${placeId}:`, error);
        return null;
    }
}

/**
 * Retrieves all saved businesses from Firestore and enriches them with details from Google Places API.
 */
export async function getSavedBusinessesAction(): Promise<{ businesses: PlaceDetails[], error?: string }> {
    const db = getDbInstance();
    try {
        const snapshot = await db.collection('directory').orderBy('createdAt', 'desc').get();
        if (snapshot.empty) {
            return { businesses: [] };
        }
        
        const placeIds = snapshot.docs.map(doc => doc.data().placeId);
        
        // Fetch details for all place IDs in parallel
        const businessDetailsPromises = placeIds.map(id => getPlaceDetails(id));
        const resolvedDetails = await Promise.all(businessDetailsPromises);

        // Filter out any null results from failed API calls
        const businesses = resolvedDetails.filter((detail): detail is PlaceDetails => detail !== null);
        
        // Map Firestore category to the final object
        businesses.forEach(business => {
            const firestoreDoc = snapshot.docs.find(doc => doc.id === business.id);
            if (firestoreDoc) {
                business.category = firestoreDoc.data().category || business.category;
            }
        });

        return { businesses };

    } catch (error) {
        console.error("Error getting saved businesses:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { businesses: [], error: errorMessage };
    }
}


/**
 * Deletes a business from the Firestore directory.
 */
export async function deleteBusinessAction(placeId: string): Promise<{ success: boolean, error?: string }> {
    const db = getDbInstance();
    try {
        await db.collection('directory').doc(placeId).delete();
        revalidatePath('/dashboard/admin/directory');
        return { success: true };
    } catch (error) {
        console.error("Error deleting business:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}
