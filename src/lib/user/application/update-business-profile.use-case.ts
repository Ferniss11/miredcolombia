// application/update-business-profile.use-case.ts
import type { User, BusinessProfile } from '../domain/user.entity';
import type { UserRepository } from '../domain/user.repository';

export class UpdateBusinessProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(uid: string, businessProfileData: BusinessProfile): Promise<User> {
    const userToUpdate = {
      businessProfile: businessProfileData,
      updatedAt: new Date(),
    };
    return this.userRepository.update(uid, userToUpdate);
  }
}
