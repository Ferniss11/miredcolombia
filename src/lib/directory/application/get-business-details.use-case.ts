// src/lib/directory/application/get-business-details.use-case.ts

import type { Business } from '../domain/business.entity';
import type { DirectoryRepository } from '../domain/directory.repository';
import type { CacheAdapter } from '../infrastructure/cache/cache.adapter';
import type { SearchAdapter } from '../infrastructure/search/search.adapter';

/**
 * Orchestrates the process of fetching business details, utilizing caching
 * and external APIs to provide a complete, up-to-date business entity.
 */
export class GetBusinessDetailsUseCase {
  constructor(
    private readonly directoryRepository: DirectoryRepository,
    private readonly searchAdapter: SearchAdapter,
    private readonly cacheAdapter: CacheAdapter
  ) {}

  async execute(id: string): Promise<Business | null> {
    // 1. Get internal data first, which is essential (e.g., category, verification status).
    const internalData = await this.directoryRepository.findById(id);
    if (!internalData) {
      // If it's not in our primary directory, it doesn't exist for us.
      return null;
    }

    // 2. Try to get the enriched data from the cache.
    const cachedData = await this.cacheAdapter.get(id);
    if (cachedData) {
      // Cache HIT: Combine internal data with cached data and return.
      return { ...cachedData, ...internalData };
    }

    // 3. Cache MISS: Fetch fresh, rich details from the external search provider (Google).
    const externalData = await this.searchAdapter.getRichDetails(id);
    if (!externalData) {
      // If Google API fails, we might return just our internal data,
      // but for this case, we'll consider it a failure to get full details.
      return null;
    }
    
    // 4. Save the fresh data to the cache for next time.
    await this.cacheAdapter.set(id, externalData);

    // 5. Combine and return the complete, fresh entity.
    const finalBusinessEntity: Business = {
        ...internalData,
        ...externalData,
    };

    return finalBusinessEntity;
  }
}