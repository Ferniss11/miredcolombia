// src/lib/service-listing/application/update-service-listing.use-case.ts
import type { ServiceListing } from '../domain/service-listing.entity';
import type { ServiceListingRepository } from '../domain/service-listing.repository';

export type UpdateServiceListingInput = Partial<Omit<ServiceListing, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

/**
 * Use case for updating an existing service listing.
 */
export class UpdateServiceListingUseCase {
  constructor(private readonly repository: ServiceListingRepository) {}

  async execute(id: string, data: UpdateServiceListingInput, actorId: string, actorRoles: string[]): Promise<ServiceListing> {
    const listing = await this.repository.findById(id);
    if (!listing) {
      throw new Error('Service listing not found.');
    }
    
    // Authorization check: Only owner or admin can update
    if (listing.userId !== actorId && !actorRoles.includes('Admin') && !actorRoles.includes('SAdmin')) {
      throw new Error('Forbidden: You do not have permission to update this listing.');
    }

    const dataToUpdate = {
      ...data,
      updatedAt: new Date(),
    };
    return this.repository.update(id, dataToUpdate);
  }
}