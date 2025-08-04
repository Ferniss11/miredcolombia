// application/get-user-profile.use-case.ts
import type { User } from '../domain/user.entity';
import type { UserRepository } from '../domain/user.repository';

export class GetUserProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(uid: string): Promise<User | null> {
    return this.userRepository.findByUid(uid);
  }
}
