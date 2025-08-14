// src/lib/real-estate/application/get-all-properties.use-case.ts
import type { Property } from '../domain/property.entity';
import type { PropertyRepository } from '../domain/property.repository';

/**
 * Use case for fetching all property listings.
 */
export class GetAllPropertiesUseCase {
  constructor(private readonly repository: PropertyRepository) {}

  async execute(status?: Property['status']): Promise<Property[]> {
    return this.repository.findAll(status);
  }
}
