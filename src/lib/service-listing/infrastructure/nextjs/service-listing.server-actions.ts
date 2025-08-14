// src/lib/service-listing/infrastructure/nextjs/service-listing.server-actions.ts
'use server';

import type { ServiceListing } from '../../domain/service-listing.entity';
import { FirestoreServiceListingRepository } from '../persistence/firestore-service-listing.repository';

// Helper to serialize Date objects to ISO strings for client components
const serializeServiceListing = (listing: ServiceListing | null): ServiceListing | null => {
    if (!listing) return null;
    return {
        ...listing,
        createdAt: listing.createdAt.toISOString(),
        updatedAt: listing.updatedAt.toISOString(),
    } as any;
};

export async function getPublishedServiceListingsAction(): Promise<{ listings?: ServiceListing[], error?: string }> {
    try {
        const repository = new FirestoreServiceListingRepository();
        const listings = await repository.findPublished();
        return { listings: listings.map(l => serializeServiceListing(l) as ServiceListing) };
    } catch (error) {
        console.error("Error fetching published service listings:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { error: errorMessage };
    }
}
