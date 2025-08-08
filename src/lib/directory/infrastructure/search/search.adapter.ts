// src/lib/directory/infrastructure/search/search.adapter.ts

import type { Business } from '../../domain/business.entity';

/**
 * Defines the contract (port) for a search provider adapter.
 * This allows the application to fetch rich business details from an
 * external source like Google Places, Yelp, etc.
 */
export interface SearchAdapter {
  /**
   * Retrieves rich, detailed information about a business from an external provider.
   * @param id - The unique identifier (e.g., Place ID) of the business.
   * @returns A partial Business entity containing the fetched details, or null if not found.
   */
  getRichDetails(id: string): Promise<Partial<Business> | null>;
}