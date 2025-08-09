// src/lib/service-listing/application/get-service-listing.use-case.ts
import type { ServiceListing } from '../domain/service-listing.entity';
import type { ServiceListingRepository } from '../domain/service-listing.repository';

/**
 * Use case for fetching a single service listing by its ID.
 */
export class GetServiceListingUseCase {
  constructor(private readonly repository: ServiceListingRepository) {}

  async execute(id: string): Promise<ServiceListing | null> {
    return this.repository.findById(id);
  }
}
