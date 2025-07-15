
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
 * @returns An object containing the list of places.
 */
export async function searchBusinessesOnGoogleAction(query: string) {
    try {
        const result = await googlePlacesSearch({ query });
        if (result.error) {
            throw new Error(result.error);
        }
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
            error: `Error en la búsqueda de Google: ${errorMessage}`,
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
export async function saveBusinessAction(placeId: string, category: string, adminUid: string) {
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
            subscriptionTier: 'Gratuito', // Default tier
            isFeatured: false,
            ownerUid: null,
            addedBy: adminUid,
            createdAt: FieldValue.serverTimestamp(),
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
 * This is used to enrich the data we get from Firestore.
 * @param placeId The Place ID to look up.
 * @returns The place details or null if not found.
 */
async function getPlaceDetails(placeId: string): Promise<Omit<PlaceDetails, 'category' | 'subscriptionTier' | 'ownerUid'> | null> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable not set.");
    }
    try {
        const response = await googleMapsClient.placeDetails({
            params: {
                place_id: placeId,
                fields: ['name', 'formatted_address', 'place_id'],
                key: apiKey,
            }
        });

        if (response.data.status === 'OK') {
            const result = response.data.result;
            return {
                id: result.place_id!,
                displayName: result.name || 'Nombre no disponible',
                formattedAddress: result.formatted_address || 'Dirección no disponible',
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
export async function getSavedBusinessesAction(): Promise<{ businesses?: PlaceDetails[], error?: string }> {
    const db = getDbInstance();
    try {
        const snapshot = await db.collection('directory').orderBy('createdAt', 'desc').get();
        if (snapshot.empty) {
            return { businesses: [] };
        }
        
        // Fetch details for all place IDs in parallel
        const businessDetailsPromises = snapshot.docs.map(async (doc) => {
            const docData = doc.data();
            const placeId = docData.placeId;

            const details = await getPlaceDetails(placeId);
            if (!details) return null; // Skip if Google API fails for one ID

            return {
                ...details,
                category: docData.category,
                subscriptionTier: docData.subscriptionTier,
                ownerUid: docData.ownerUid,
            } as PlaceDetails;
        });
        
        const resolvedDetails = await Promise.all(businessDetailsPromises);
        const businesses = resolvedDetails.filter((detail): detail is PlaceDetails => detail !== null);

        return { businesses };

    } catch (error) {
        console.error("Error getting saved businesses:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { error: errorMessage };
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

/**
 * Links a Google Place to an advertiser's user profile.
 * @param userId The advertiser's UID.
 * @param placeId The Google Place ID of their business.
 */
export async function linkBusinessToAdvertiserAction(userId: string, placeId: string): Promise<{ success: boolean; error?: string }> {
    const db = getDbInstance();
    try {
        const userRef = db.collection('users').doc(userId);
        const businessRef = db.collection('directory').doc(placeId);

        // Check if the business exists in our directory
        const businessSnap = await businessRef.get();
        if (!businessSnap.exists) {
            return { success: false, error: 'Este negocio no existe en nuestro directorio. Por favor, contacta con un administrador.' };
        }
        
        // Check if the business is already claimed
        if (businessSnap.data()?.ownerUid) {
             return { success: false, error: 'Este negocio ya ha sido reclamado por otro usuario.' };
        }

        // Use a transaction to ensure atomicity
        await db.runTransaction(async (transaction) => {
            // Update the business document with the owner's UID
            transaction.update(businessRef, { ownerUid: userId });
            // Update the user's profile with the Place ID
            transaction.update(userRef, { 'businessProfile.placeId': placeId });
        });

        revalidatePath('/dashboard/admin/directory');
        revalidatePath('/dashboard/advertiser/profile');

        return { success: true };

    } catch (error) {
        console.error("Error linking business to advertiser:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}
