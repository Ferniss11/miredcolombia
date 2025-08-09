// application/soft-delete-user.use-case.ts
import type { UserRepository } from '../domain/user.repository';

export class SoftDeleteUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(uid: string): Promise<void> {
    // Here we could add more logic, like checking if the user
    // has active subscriptions before deleting, etc.
    return this.userRepository.softDelete(uid);
  }
}
