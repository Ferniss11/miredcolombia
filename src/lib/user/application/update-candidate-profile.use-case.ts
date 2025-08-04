// application/update-candidate-profile.use-case.ts
import type { User, CandidateProfile } from '../domain/user.entity';
import type { UserRepository } from '../domain/user.repository';

export class UpdateCandidateProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  // Note: File upload logic will be handled by the adapter/server-action layer.
  // The use case is only concerned with updating the data (like the resume URL).
  async execute(uid: string, candidateProfileData: CandidateProfile): Promise<User> {
    const userToUpdate = {
      candidateProfile: candidateProfileData,
      updatedAt: new Date(),
    };
    return this.userRepository.update(uid, userToUpdate);
  }
}
