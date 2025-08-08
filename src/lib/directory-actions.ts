
'use server';

import type { PlaceDetails } from "./types";
import { GetBusinessDetailsUseCase } from './directory/application/get-business-details.use-case';
import { FirestoreDirectoryRepository } from './directory/infrastructure/persistence/firestore-directory.repository';
import { GooglePlacesAdapter } from './directory/infrastructure/search/google-places.adapter';
import { FirestoreCacheAdapter } from './directory/infrastructure/cache/firestore-cache.adapter';


export async function getSavedBusinessesAction(forPublic: boolean = false): Promise<{ businesses?: PlaceDetails[], error?: string }> {
    try {
        const directoryRepository = new FirestoreDirectoryRepository();
        // We only care about the internal data from our DB here for the list view.
        const internalBusinesses = await directoryRepository.findAll(forPublic);

        const businesses = internalBusinesses.map(biz => ({
            id: biz.id,
            displayName: biz.displayName,
            formattedAddress: biz.formattedAddress,
            category: biz.category,
            subscriptionTier: biz.subscriptionTier,
            ownerUid: biz.ownerUid,
            verificationStatus: biz.verificationStatus,
            // A simplified photo URL is constructed here for the list view.
            // A full fetch isn't needed for every card, improving performance.
            photoUrl: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${biz.photos?.[0]?.photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}` || "https://placehold.co/400x250.png",
            rating: biz.rating,
            city: biz.city,
        } as PlaceDetails));

        return { businesses };

    } catch (error) {
        console.error("Error getting saved businesses:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { error: errorMessage };
    }
}


export async function getBusinessDetailsForVerificationAction(placeId: string) {
    try {
        const searchAdapter = new GooglePlacesAdapter();
        const details = await searchAdapter.getRichDetails(placeId);

        if (!details || !details.internationalPhoneNumber) {
            return { error: 'No se pudo obtener el teléfono de este negocio para verificación. Intenta con otro.' };
        }
        
        const phone = details.internationalPhoneNumber;
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
