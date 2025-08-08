
'use server';

import type { PlaceDetails } from "./types";
import { Business } from './directory/domain/business.entity';
import { GetBusinessDetailsUseCase } from './directory/application/get-business-details.use-case';
import { FirestoreDirectoryRepository } from './directory/infrastructure/persistence/firestore-directory.repository';
import { GooglePlacesAdapter } from './directory/infrastructure/search/google-places.adapter';
import { FirestoreCacheAdapter } from './directory/infrastructure/cache/firestore-cache.adapter';


// Helper to serialize Date objects to ISO strings for client components
const serializeBusiness = (business: Business | null): PlaceDetails | null => {
    if (!business) return null;

    const serialized: any = { ...business };

    // Recursively serialize Date objects
    const serializeDates = (obj: any) => {
        for (const key in obj) {
            if (obj[key] instanceof Date) {
                obj[key] = obj[key].toISOString();
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                serializeDates(obj[key]);
            }
        }
    }

    serializeDates(serialized);
    return serialized as PlaceDetails;
}


export async function getSavedBusinessesAction(forPublic: boolean = false): Promise<{ businesses?: PlaceDetails[], error?: string }> {
    try {
        const directoryRepository = new FirestoreDirectoryRepository();
        const searchAdapter = new GooglePlacesAdapter();
        const cacheAdapter = new FirestoreCacheAdapter();
        
        const getBusinessDetailsUseCase = new GetBusinessDetailsUseCase(
            directoryRepository,
            searchAdapter,
            cacheAdapter
        );
        
        const internalBusinesses = await directoryRepository.findAll(forPublic);

        const businessPromises = internalBusinesses.map(biz => getBusinessDetailsUseCase.execute(biz.id));
        const resolvedBusinesses = await Promise.all(businessPromises);

        const businesses = resolvedBusinesses
            .map(serializeBusiness) // Serialize each business
            .filter((biz): biz is PlaceDetails => biz !== null)
            .map(biz => ({
                ...biz,
                photoUrl: biz.photos?.[0]?.url || "https://placehold.co/400x250.png",
            }));
            
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

        const placeDetails = serializeBusiness({
            ...business,
            city: business.city || 'Ciudad no disponible',
        });

        if (!placeDetails) {
            return { error: 'Error serializando los datos del negocio.' };
        }
        
        return { business: placeDetails };
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error in getPublicBusinessDetailsAction for ${slug}:`, errorMessage);
        return { error: 'Ocurrió un error al cargar los detalles del negocio.' };
    }
}
