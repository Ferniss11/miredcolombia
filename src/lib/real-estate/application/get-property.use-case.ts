// src/lib/real-estate/application/get-property.use-case.ts
import type { Property } from '../domain/property.entity';
import type { PropertyRepository } from '../domain/property.repository';

/**
 * Use case for fetching a single property by its ID.
 */
export class GetPropertyUseCase {
  constructor(private readonly repository: PropertyRepository) {}

  async execute(id: string): Promise<Property | null> {
    return this.repository.findById(id);
  }
}
