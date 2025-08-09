// application/update-candidate-profile.use-case.ts
import type { User, CandidateProfile } from '../domain/user.entity';
import type { UserRepository } from '../domain/user.repository';

export class UpdateCandidateProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  // The use case is only concerned with updating the data (like the resume URL).
  async execute(uid: string, candidateProfileData: Partial<CandidateProfile>): Promise<User> {
    const existingUser = await this.userRepository.findByUid(uid);
    if (!existingUser) {
        throw new Error(`User with UID ${uid} not found.`);
    }

    // Deep merge the new data with the existing profile to avoid overwriting fields
    const updatedProfile = {
      ...existingUser.candidateProfile,
      ...candidateProfileData,
    };
    
    const userToUpdate = {
      candidateProfile: updatedProfile,
      updatedAt: new Date(),
    };

    return this.userRepository.update(uid, userToUpdate);
  }
}
