// src/lib/real-estate/application/update-property-status.use-case.ts
import type { Property } from '../domain/property.entity';
import type { PropertyRepository } from '../domain/property.repository';
import type { UserRole } from '@/lib/user/domain/user.entity';

type UpdatePropertyStatusInput = {
  propertyId: string;
  status: 'available' | 'rejected' | 'rented' | 'sold';
  actorRoles: UserRole[];
};

/**
 * Use case specifically for moderation actions (approve/reject).
 */
export class UpdatePropertyStatusUseCase {
  constructor(private readonly repository: PropertyRepository) {}

  async execute({ propertyId, status, actorRoles }: UpdatePropertyStatusInput): Promise<Property> {
    const isAdmin = actorRoles.includes('Admin') || actorRoles.includes('SAdmin');
    if (!isAdmin) {
      throw new Error('Forbidden: Only administrators can change property status.');
    }

    const dataToUpdate: Partial<Property> = {
      status,
      updatedAt: new Date(),
    };
    
    return this.repository.update(propertyId, dataToUpdate);
  }
}
