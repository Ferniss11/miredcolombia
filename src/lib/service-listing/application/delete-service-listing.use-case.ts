// src/lib/service-listing/application/delete-service-listing.use-case.ts
import type { ServiceListingRepository } from '../domain/service-listing.repository';

/**
 * Use case for deleting a service listing.
 */
export class DeleteServiceListingUseCase {
  constructor(private readonly repository: ServiceListingRepository) {}

  async execute(id: string, actorId: string, actorRoles: string[]): Promise<void> {
    const listing = await this.repository.findById(id);
    if (!listing) {
      throw new Error('Service listing not found.');
    }
    
    // Authorization check: Only owner or admin can delete
    if (listing.userId !== actorId && !actorRoles.includes('Admin') && !actorRoles.includes('SAdmin')) {
      throw new Error('Forbidden: You do not have permission to delete this listing.');
    }

    return this.repository.delete(id);
  }
}
