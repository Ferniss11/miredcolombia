// src/lib/service-listing/application/create-service-listing.use-case.ts
import type { ServiceListing } from '../domain/service-listing.entity';
import type { ServiceListingRepository } from '../domain/service-listing.repository';

export type CreateServiceListingInput = Omit<ServiceListing, 'id' | 'createdAt' | 'updatedAt' | 'isFeatured' | 'status'>;

/**
 * Use case for creating a new service listing.
 */
export class CreateServiceListingUseCase {
  constructor(private readonly repository: ServiceListingRepository) {}

  async execute(input: CreateServiceListingInput): Promise<ServiceListing> {
    const now = new Date();
    const listingToCreate: Omit<ServiceListing, 'id'> = {
      ...input,
      isFeatured: false,
      status: 'pending_review', // Listings must be approved by an admin
      createdAt: now,
      updatedAt: now,
    };
    return this.repository.create(listingToCreate);
  }
}
