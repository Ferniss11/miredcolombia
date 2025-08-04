// application/create-user-profile.use-case.ts
import { User, UserRole } from '../domain/user.entity';
import { UserRepository } from '../domain/user.repository';

export type CreateUserInput = {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  
};

export class CreateUserProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    const now = new Date();
    const newUser: User = {
      ...input,
      status: 'active', // Set default status for new users
      createdAt: now,
      updatedAt: now,
    };
    return this.userRepository.create(newUser);
  }
}
