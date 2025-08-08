// src/lib/directory/application/link-business-to-user.use-case.ts
import type { Business } from '../domain/business.entity';
import type { DirectoryRepository } from '../domain/directory.repository';
import type { UserRepository } from '@/lib/user/domain/user.repository';
import type { SearchAdapter } from '../infrastructure/search/search.adapter';

export type LinkBusinessInput = {
  userId: string;
  placeId: string;
  providedPhone: string;
};

/**
 * Use case for an advertiser to claim ownership of a business.
 * It verifies ownership via phone number and updates both the user and directory records.
 */
export class LinkBusinessToUserUseCase {
  constructor(
    private readonly directoryRepository: DirectoryRepository,
    private readonly userRepository: UserRepository,
    private readonly searchAdapter: SearchAdapter
  ) {}

  async execute({ userId, placeId, providedPhone }: LinkBusinessInput): Promise<Business> {
    // 1. Get official details from external provider to verify phone
    const externalDetails = await this.searchAdapter.getRichDetails(placeId);
    if (!externalDetails || !externalDetails.internationalPhoneNumber) {
      throw new Error('Could not retrieve business details for verification from Google.');
    }

    // 2. Normalize and verify phone numbers
    const googlePhone = externalDetails.internationalPhoneNumber.replace(/[\s-()]/g, '');
    const userPhone = providedPhone.replace(/[\s-()]/g, '');
    if (googlePhone !== userPhone) {
      throw new Error('Phone number does not match the official record.');
    }

    // 3. Check if the business in our directory is already claimed
    let business = await this.directoryRepository.findById(placeId);
    if (business && business.ownerUid) {
      throw new Error('This business has already been claimed by another user.');
    }

    // 4. If business doesn't exist in our directory, create a placeholder
    if (!business) {
        const newBusinessData: Partial<Business> = {
            id: placeId,
            category: 'Sin Categoría', // Admin can categorize later
            subscriptionTier: 'Gratuito',
            isFeatured: false,
            createdAt: new Date(),
            displayName: externalDetails.displayName!,
            formattedAddress: externalDetails.formattedAddress!,
            city: 'Ciudad Desconocida', // Will be updated
        };
       await this.directoryRepository.save(newBusinessData as Business);
    }
    
    // 5. Update records to link user and business, and set status to 'pending'
    const userUpdate = {
        'businessProfile.placeId': placeId,
        'businessProfile.businessName': externalDetails.displayName,
        'businessProfile.address': externalDetails.formattedAddress,
        'businessProfile.phone': externalDetails.internationalPhoneNumber,
        'businessProfile.website': externalDetails.website || '',
        'businessProfile.verificationStatus': 'pending',
    };
    await this.userRepository.update(userId, userUpdate as Partial<User>);

    await this.directoryRepository.update(placeId, {
      ownerUid: userId,
      verificationStatus: 'pending',
    });
    
    const updatedBusiness = await this.directoryRepository.findById(placeId);
    if (!updatedBusiness) {
        throw new Error("Failed to retrieve linked business.");
    }

    return updatedBusiness;
  }
}
