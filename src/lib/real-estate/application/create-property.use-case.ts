// src/lib/real-estate/application/create-property.use-case.ts
import type { Property } from '../domain/property.entity';
import type { PropertyRepository } from '../domain/property.repository';
import type { User } from '@/lib/user/domain/user.entity';

export type CreatePropertyInput = Omit<Property, 'id' | 'createdAt' | 'updatedAt' | 'owner' | 'status'>;

/**
 * Use case for creating a new property listing.
 */
export class CreatePropertyUseCase {
  constructor(private readonly repository: PropertyRepository) {}

  async execute(input: CreatePropertyInput, user: User): Promise<Property> {
    const now = new Date();
    
    const ownerInfo = {
      userId: user.uid,
      name: user.name,
      isTrusted: false, // This could be based on user history in the future
      joinedAt: user.createdAt || new Date(), // Fallback to now() if createdAt is undefined
    };

    const propertyToCreate: Omit<Property, 'id'> = {
      ...input,
      owner: ownerInfo,
      status: 'pending_review', // All new properties must be approved
      createdAt: now,
      updatedAt: now,
    };
    
    return this.repository.create(propertyToCreate);
  }
}
