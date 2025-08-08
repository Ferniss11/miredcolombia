// application/update-business-profile.use-case.ts
import type { User, BusinessProfile } from '../domain/user.entity';
import type { UserRepository } from '../domain/user.repository';

export class UpdateBusinessProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(uid: string, businessProfileData: Partial<BusinessProfile>): Promise<User> {
    const existingUser = await this.userRepository.findByUid(uid);
    
    // Deep merge the new data with the existing profile
    const updatedProfile = {
      ...existingUser?.businessProfile,
      ...businessProfileData
    };
    
    if (businessProfileData.agentConfig) {
        updatedProfile.agentConfig = {
            ...existingUser?.businessProfile?.agentConfig,
            ...businessProfileData.agentConfig,
        }
    }

    const userToUpdate = {
      businessProfile: updatedProfile,
      updatedAt: new Date(),
    };

    return this.userRepository.update(uid, userToUpdate);
  }
}
