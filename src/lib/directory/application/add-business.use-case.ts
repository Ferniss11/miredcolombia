// src/lib/directory/application/add-business.use-case.ts
import type { Business } from '../domain/business.entity';
import type { DirectoryRepository } from '../domain/directory.repository';

export type AddBusinessInput = {
  placeId: string;
  category: string;
  adminUid: string;
};

/**
 * Use case for adding a new business to the directory.
 * This is typically performed by an administrator.
 */
export class AddBusinessUseCase {
  constructor(private readonly directoryRepository: DirectoryRepository) {}

  async execute({ placeId, category, adminUid }: AddBusinessInput): Promise<Business> {
    const existingBusiness = await this.directoryRepository.findById(placeId);
    if (existingBusiness) {
      throw new Error('This business already exists in the directory.');
    }

    const newBusinessData: Partial<Business> = {
      id: placeId,
      category,
      subscriptionTier: 'Gratuito',
      isFeatured: false,
      ownerUid: null,
      verificationStatus: 'unclaimed',
      isAgentEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.directoryRepository.save(newBusinessData as Business);
    
    const savedBusiness = await this.directoryRepository.findById(placeId);
    if (!savedBusiness) {
        throw new Error("Failed to retrieve the business after saving.");
    }
    
    return savedBusiness;
  }
}
