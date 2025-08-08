// src/lib/directory/infrastructure/cache/cache.adapter.ts

import type { Business } from '../../domain/business.entity';

/**
 * Defines the contract (port) for a cache storage adapter.
 * This allows the application to be independent of the specific caching
 * technology (e.g., Firestore, Redis).
 */
export interface CacheAdapter {
  /**
   * Retrieves a business entity from the cache.
   * @param id - The unique identifier (Place ID) of the business.
   * @returns The cached Business entity or null if not found or expired.
   */
  get(id: string): Promise<Business | null>;

  /**
   * Stores a business entity in the cache.
   * @param id - The unique identifier (Place ID) of the business.
   * @param data - The business entity to cache.
   * @returns A promise that resolves when the operation is complete.
   */
  set(id: string, data: Partial<Business>): Promise<void>;
}