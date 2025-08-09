// application/get-all-users.use-case.ts
import type { User } from '../domain/user.entity';
import type { UserRepository } from '../domain/user.repository';

export class GetAllUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<User[]> {
    const allUsers = await this.userRepository.findAll();
    // Sort users so that 'SAdmin' and 'Admin' appear first
    return allUsers.sort((a, b) => {
        if (a.role === 'SAdmin') return -1;
        if (b.role === 'SAdmin') return 1;
        if (a.role === 'Admin') return -1;
        if (b.role === 'Admin') return 1;
        return 0;
    });
  }
}
