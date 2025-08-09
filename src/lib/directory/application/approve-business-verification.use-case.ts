// src/lib/directory/application/approve-business-verification.use-case.ts
import type { DirectoryRepository } from '../domain/directory.repository';
import type { UserRepository } from '@/lib/user/domain/user.repository';

export type ApproveBusinessVerificationInput = {
  placeId: string;
  ownerUid: string;
  status: 'approved' | 'rejected';
};

/**
 * Use case for an administrator to approve or reject a business ownership claim.
 */
export class ApproveBusinessVerificationUseCase {
  constructor(
    private readonly directoryRepository: DirectoryRepository,
    private readonly userRepository: UserRepository
  ) {}

  async execute({ placeId, ownerUid, status }: ApproveBusinessVerificationInput): Promise<void> {
    if (status === 'approved') {
      await this.directoryRepository.update(placeId, { verificationStatus: 'approved' });
      await this.userRepository.update(ownerUid, {
        businessProfile: { verificationStatus: 'approved' } as any, // Cast to avoid full profile requirement
      });
    } else { // 'rejected'
      // If rejected, unlink the business from the user
      await this.directoryRepository.update(placeId, {
        ownerUid: null,
        verificationStatus: 'unclaimed',
      });
      await this.userRepository.update(ownerUid, {
        businessProfile: {
          placeId: undefined,
          verificationStatus: undefined,
        } as any,
      });
    }
  }
}
