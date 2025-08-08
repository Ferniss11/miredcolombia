
'use server';

import { adminDb } from "./firebase/admin-config";
import type { PlaceDetails } from "./types";
import { GetBusinessDetailsUseCase } from './directory/application/get-business-details.use-case';
import { FirestoreDirectoryRepository } from './directory/infrastructure/persistence/firestore-directory.repository';
import { GooglePlacesAdapter } from './directory/infrastructure/search/google-places.adapter';
import { FirestoreCacheAdapter } from './directory/infrastructure/cache/firestore-cache.adapter';


function getDbInstance() {
    if (!adminDb) {
        throw new Error("Firebase Admin SDK is not initialized. Directory service is unavailable.");
    }
    return adminDb;
}


async function getPlaceDetails(placeId: string, fields: string[]): Promise<any | null> {
    const searchAdapter = new GooglePlacesAdapter();
    const details = await searchAdapter.getRichDetails(placeId);
    if (!details) return null;
    
    // This is a rough adaptation, a more robust mapping might be needed
    return {
        place_id: placeId,
        name: details.displayName,
        formatted_address: details.formattedAddress,
        photos: details.photos,
        rating: details.rating,
        address_components: [], // This part is tricky without a direct API call for it.
        international_phone_number: details.internationalPhoneNumber,
        formatted_phone_number: details.internationalPhoneNumber,
        website: details.website,
    };
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
            const placeId = doc.id;

            const fields = ['name', 'place_id', 'photos', 'rating', 'address_components'];
            const details = await getPlaceDetails(placeId, fields);
            if (!details) return null;

            const cityComponent = details.address_components?.find((c: any) => c.types.includes('locality'));
            const city = cityComponent ? cityComponent.long_name : 'Ciudad no disponible';

            return {
                id: details.place_id!,
                displayName: details.name || 'Nombre no disponible',
                formattedAddress: details.formatted_address || 'Dirección no disponible',
                category: docData.category,
                subscriptionTier: docData.subscriptionTier,
                ownerUid: docData.ownerUid,
                verificationStatus: docData.verificationStatus,
                photoUrl: details.photos?.[0] ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${details.photos[0].photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}` : "https://placehold.co/400x250.png",
                rating: details.rating,
                city: city,
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


export async function getBusinessDetailsForVerificationAction(placeId: string) {
    try {
        const details = await getPlaceDetails(placeId, ['formatted_phone_number']);
        if (!details || !details.formatted_phone_number) {
            return { error: 'No se pudo obtener el teléfono de este negocio para verificación. Intenta con otro.' };
        }
        
        const phone = details.formatted_phone_number;
        const partialPhone = phone.slice(0, 3) + '***' + phone.slice(-3);

        return { success: true, details: { partialPhone } };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return { error: `Error obteniendo detalles para verificación: ${errorMessage}` };
    }
}


export async function getPublicBusinessDetailsAction(slug: string): Promise<{ business?: PlaceDetails, error?: string }> {
    try {
        const directoryRepository = new FirestoreDirectoryRepository();
        const searchAdapter = new GooglePlacesAdapter();
        const cacheAdapter = new FirestoreCacheAdapter();
        
        const getBusinessDetailsUseCase = new GetBusinessDetailsUseCase(
            directoryRepository,
            searchAdapter,
            cacheAdapter
        );
        
        const business = await getBusinessDetailsUseCase.execute(slug);

        if (!business) {
            return { error: 'Negocio no encontrado.' };
        }

        const placeDetails: PlaceDetails = {
            ...business,
            city: business.city || 'Ciudad no disponible',
        };

        return { business: placeDetails };
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error in getPublicBusinessDetailsAction for ${slug}:`, errorMessage);
        return { error: 'Ocurrió un error al cargar los detalles del negocio.' };
    }
}
