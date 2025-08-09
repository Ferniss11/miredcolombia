// src/lib/service-listing/application/get-all-service-listings.use-case.ts
import type { ServiceListing } from '../domain/service-listing.entity';
import type { ServiceListingRepository } from '../domain/service-listing.repository';

/**
 * Use case for fetching all service listings.
 */
export class GetAllServiceListingsUseCase {
  constructor(private readonly repository: ServiceListingRepository) {}

  async execute(): Promise<ServiceListing[]> {
    return this.repository.findAll();
  }
}
