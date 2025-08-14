// src/lib/real-estate/application/delete-property.use-case.ts
import type { PropertyRepository } from '../domain/property.repository';
import type { UserRole } from '@/lib/user/domain/user.entity';

/**
 * Use case for deleting a property listing.
 */
export class DeletePropertyUseCase {
  constructor(private readonly repository: PropertyRepository) {}

  async execute(propertyId: string, actorId: string, actorRoles: UserRole[]): Promise<void> {
    const property = await this.repository.findById(propertyId);
    if (!property) {
      throw new Error('Property not found.');
    }
    
    // Authorization: Only the owner or an Admin/SAdmin can delete.
    const isOwner = property.owner.userId === actorId;
    const isAdmin = actorRoles.includes('Admin') || actorRoles.includes('SAdmin');

    if (!isOwner && !isAdmin) {
      throw new Error('Forbidden: You do not have permission to delete this property.');
    }

    // In a real application, you might also delete associated images from storage here.
    return this.repository.delete(propertyId);
  }
}
