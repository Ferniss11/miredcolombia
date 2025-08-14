// src/lib/real-estate/application/update-property.use-case.ts
import type { Property } from '../domain/property.entity';
import type { PropertyRepository } from '../domain/property.repository';
import type { UserRole } from '@/lib/user/domain/user.entity';

export type UpdatePropertyInput = Partial<Omit<Property, 'id' | 'owner' | 'createdAt' | 'updatedAt'>>;

/**
 * Use case for updating an existing property listing.
 */
export class UpdatePropertyUseCase {
  constructor(private readonly repository: PropertyRepository) {}

  async execute(propertyId: string, data: UpdatePropertyInput, actorId: string, actorRoles: UserRole[]): Promise<Property> {
    const property = await this.repository.findById(propertyId);
    if (!property) {
      throw new Error('Property not found.');
    }

    const isOwner = property.owner.userId === actorId;
    const isAdmin = actorRoles.includes('Admin') || actorRoles.includes('SAdmin');

    if (!isOwner && !isAdmin) {
      throw new Error('Forbidden: You do not have permission to update this property.');
    }
    
    // If a non-admin owner updates the property, it should go back to pending review
    const newStatus = isAdmin ? property.status : 'pending_review';

    const dataToUpdate: Partial<Property> = {
      ...data,
      status: newStatus,
      updatedAt: new Date(),
    };

    return this.repository.update(propertyId, dataToUpdate);
  }
}
