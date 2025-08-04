// application/get-all-users.use-case.ts
import type { User } from '../domain/user.entity';
import type { UserRepository } from '../domain/user.repository';

export class GetAllUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
