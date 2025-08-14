// src/lib/service-listing/domain/service-listing.repository.ts
import type { ServiceListing } from './service-listing.entity';

/**
 * Defines the contract (port) for interacting with the service listing data persistence layer.
 */
export interface ServiceListingRepository {
  create(listing: Omit<ServiceListing, 'id'>): Promise<ServiceListing>;
  findById(id: string): Promise<ServiceListing | null>;
  findAll(): Promise<ServiceListing[]>;
  findByUserId(userId: string): Promise<ServiceListing[]>;
  findPublished(): Promise<ServiceListing[]>;
  update(id: string, data: Partial<ServiceListing>): Promise<ServiceListing>;
  delete(id: string): Promise<void>;
}
