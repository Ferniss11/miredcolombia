// application/update-user-profile.use-case.ts
import type { User } from '../domain/user.entity';
import type { UserRepository } from '../domain/user.repository';

type UpdateProfileInput = {
    name: string;
    // Add other updatable basic fields here in the future
}

export class UpdateUserProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(uid: string, data: UpdateProfileInput): Promise<User> {
    const userToUpdate = {
      ...data,
      updatedAt: new Date(),
    };
    return this.userRepository.update(uid, userToUpdate);
  }
}
