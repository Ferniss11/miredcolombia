
'use server';

import { googlePlacesSearch } from "@/ai/tools/google-places-search";
import { adminDb, adminInstance } from "./firebase/admin-config";
import { revalidatePath } from "next/cache";
import type { PlaceDetails, Photo, Review } from "./types";
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
        if ('error' in result && result.error) {
            throw new Error(String(result.error));
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
            verificationStatus: 'unclaimed',
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
 * Fetches basic details for a place ID from Google Places API.
 */
async function getPlaceDetails(placeId: string, fields: string[]): Promise<any | null> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable not set.");
    }
    try {
        const response = await googleMapsClient.placeDetails({
            params: {
                place_id: placeId,
                fields: fields,
                key: apiKey,
                language: 'es',
            }
        });

        if (response.data.status === 'OK') {
            return response.data.result;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching details for placeId ${placeId}:`, error);
        return null;
    }
}

export async function getSavedBusinessesAction(forPublic: boolean = false): Promise<{ businesses?: PlaceDetails[], error?: string }> {
    const db = getDbInstance();
    try {
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('directory');
        
        if (forPublic) {
            query = query.where('verificationStatus', '==', 'approved');
        } else {
            query = query.orderBy('createdAt', 'desc');
        }
        
        const snapshot = await query.get();

        if (snapshot.empty) {
            return { businesses: [] };
        }
        
        const businessDetailsPromises = snapshot.docs.map(async (doc) => {
            const docData = doc.data();
            const placeId = docData.placeId;

            const fields = forPublic ? ['name', 'place_id', 'photos'] : ['name', 'formatted_address', 'place_id'];
            const details = await getPlaceDetails(placeId, fields);
            if (!details) return null;

            return {
                id: details.place_id!,
                displayName: details.name || 'Nombre no disponible',
                formattedAddress: details.formatted_address || 'Dirección no disponible',
                category: docData.category,
                subscriptionTier: docData.subscriptionTier,
                ownerUid: docData.ownerUid,
                verificationStatus: docData.verificationStatus,
                // Include a photo for the public directory cards
                photoUrl: details.photos?.[0] ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${details.photos[0].photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}` : "https://placehold.co/400x250.png",
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


// --- Actions for Advertiser Business Linking ---

export async function getBusinessDetailsForVerificationAction(placeId: string) {
    try {
        const details = await getPlaceDetails(placeId, ['formatted_phone_number']);
        if (!details || !details.formatted_phone_number) {
            return { error: 'No se pudo obtener el teléfono de este negocio para verificación. Intenta con otro.' };
        }
        
        // Obfuscate phone number
        const phone = details.formatted_phone_number;
        const partialPhone = phone.slice(0, 3) + '***' + phone.slice(-3);

        return { success: true, details: { partialPhone } };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return { error: `Error obteniendo detalles para verificación: ${errorMessage}` };
    }
}


export async function verifyAndLinkBusinessAction(userId: string, placeId: string, providedPhone: string) {
    const db = getDbInstance();
    if (!FieldValue) throw new Error("Firebase Admin SDK is not fully initialized.");
    try {
        const details = await getPlaceDetails(placeId, ['international_phone_number', 'name', 'formatted_address', 'website', 'formatted_phone_number']);
        if (!details || !details.international_phone_number) {
            return { error: 'No se pudo verificar el negocio. El teléfono no está disponible en Google.' };
        }

        // Normalize phone numbers for comparison
        const googlePhone = details.international_phone_number.replace(/[\s-()]/g, '');
        const userPhone = providedPhone.replace(/[\s-()]/g, '');

        if (googlePhone !== userPhone) {
            return { error: 'El número de teléfono no coincide. Inténtalo de nuevo.' };
        }

        // If phone matches, proceed to link
        const userRef = db.collection('users').doc(userId);
        const businessRef = db.collection('directory').doc(placeId);

        await db.runTransaction(async (transaction) => {
            const businessDoc = await transaction.get(businessRef);
            if (!businessDoc.exists) {
                // Add the business to the directory if it wasn't there
                transaction.set(businessRef, {
                    placeId: placeId,
                    category: 'Sin Categoría', // Admin can categorize later
                    subscriptionTier: 'Gratuito',
                    ownerUid: userId,
                    addedBy: 'self-claimed',
                    createdAt: FieldValue.serverTimestamp(),
                    verificationStatus: 'pending',
                });
            } else {
                if(businessDoc.data()?.ownerUid) {
                    throw new Error('Este negocio ya ha sido reclamado por otro usuario.');
                }
                transaction.update(businessRef, { ownerUid: userId, verificationStatus: 'pending' });
            }
            
            transaction.update(userRef, {
                'businessProfile.placeId': placeId,
                'businessProfile.businessName': details.name,
                'businessProfile.address': details.formatted_address,
                'businessProfile.phone': details.international_phone_number,
                'businessProfile.website': details.website || '',
                'businessProfile.verificationStatus': 'pending',
            });
        });

        revalidatePath('/dashboard/advertiser/profile');
        revalidatePath('/dashboard/admin/directory');

        return { success: true, businessDetails: details };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return { error: `Error al vincular el negocio: ${errorMessage}` };
    }
}


export async function unlinkBusinessFromAdvertiserAction(userId: string, placeId: string) {
    const db = getDbInstance();
     if (!FieldValue) throw new Error("Firebase Admin SDK is not fully initialized.");

    try {
        const userRef = db.collection('users').doc(userId);
        const businessRef = db.collection('directory').doc(placeId);

         await db.runTransaction(async (transaction) => {
            transaction.update(businessRef, {
                ownerUid: FieldValue.delete(),
                verificationStatus: 'unclaimed'
            });
            transaction.update(userRef, {
                'businessProfile.placeId': FieldValue.delete(),
                'businessProfile.verificationStatus': FieldValue.delete(),
            });
        });
        
        revalidatePath('/dashboard/advertiser/profile');
        revalidatePath('/dashboard/admin/directory');
        
        return { success: true };
    } catch (error) {
         const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return { error: `Error al desvincular el negocio: ${errorMessage}` };
    }
}

export async function updateBusinessVerificationStatusAction(
  placeId: string,
  ownerUid: string,
  status: 'approved' | 'rejected'
) {
  const db = getDbInstance();
  if (!FieldValue) throw new Error("Firebase Admin SDK is not fully initialized.");
  
  const businessRef = db.collection('directory').doc(placeId);
  const userRef = db.collection('users').doc(ownerUid);

  try {
    await db.runTransaction(async (transaction) => {
      // Update the business document in the directory
      transaction.update(businessRef, {
        verificationStatus: status,
      });

      // Update the user's business profile
      if (status === 'approved') {
        transaction.update(userRef, {
          'businessProfile.verificationStatus': 'approved',
        });
      } else { // 'rejected'
        // If rejected, we unlink the business from the user completely
        transaction.update(businessRef, {
            ownerUid: FieldValue.delete(),
            verificationStatus: 'unclaimed'
        });
        transaction.update(userRef, {
          'businessProfile.placeId': FieldValue.delete(),
          'businessProfile.verificationStatus': FieldValue.delete(),
        });
      }
    });

    revalidatePath('/dashboard/admin/directory');
    revalidatePath(`/dashboard/advertiser/profile`); // The specific user's profile also changes

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating verification status:", errorMessage);
    return { error: `No se pudo actualizar el estado: ${errorMessage}` };
  }
}

export async function publishBusinessAction(placeId: string) {
    const db = getDbInstance();
    try {
        const businessRef = db.collection('directory').doc(placeId);
        await businessRef.update({
            verificationStatus: 'approved',
        });
        revalidatePath('/dashboard/admin/directory');
        revalidatePath('/directory');
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Error publishing business:", errorMessage);
        return { error: `No se pudo publicar el negocio: ${errorMessage}` };
    }
}

// --- Actions for Public Directory Pages ---

export async function getPublicBusinessDetailsAction(placeId: string): Promise<{ business?: PlaceDetails, error?: string }> {
    try {
        const db = getDbInstance();
        const dbData = await db.collection('directory').doc(placeId).get();
        if (!dbData.exists) {
            return { error: 'Este negocio no forma parte de nuestro directorio.' };
        }
        const category = dbData.data()?.category || 'Sin categoría';

        const fields = [
            'name', 'formatted_address', 'place_id', 'international_phone_number',
            'website', 'rating', 'user_ratings_total', 'photos', 'opening_hours',
            'geometry', 'reviews'
        ];
        const details = await getPlaceDetails(placeId, fields);

        if (!details) {
            return { error: 'No se pudieron obtener los detalles del negocio desde Google.' };
        }

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        const photos: Photo[] = (details.photos || []).slice(0, 10).map((p: any) => ({
             photo_reference: p.photo_reference,
             height: p.height,
             width: p.width,
             html_attributions: p.html_attributions,
             url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${p.photo_reference}&key=${apiKey}`
        }));

        const business: PlaceDetails = {
            id: details.place_id,
            displayName: details.name,
            formattedAddress: details.formatted_address,
            internationalPhoneNumber: details.international_phone_number,
            website: details.website,
            rating: details.rating,
            userRatingsTotal: details.user_ratings_total,
            openingHours: details.opening_hours?.weekday_text,
            isOpenNow: details.opening_hours?.open_now,
            photos: photos,
            reviews: (details.reviews || []) as Review[],
            geometry: details.geometry,
            category: category
        };

        return { business };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error in getPublicBusinessDetailsAction for ${placeId}:`, errorMessage);
        return { error: 'Ocurrió un error al cargar los detalles del negocio.' };
    }
}
