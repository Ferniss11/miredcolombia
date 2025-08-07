
// application/create-user-profile.use-case.ts
import { User, UserRole } from '../domain/user.entity';
import { UserRepository } from '../domain/user.repository';
import { adminAuth } from '@/lib/firebase/admin-config'; // Import Firebase Admin Auth

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

    // Step 1: Create the user profile in Firestore
    const createdUser = await this.userRepository.create(newUser);

    // Step 2: Set the custom claim on the user's auth token
    if (adminAuth) {
        try {
            // Check existing claims. This is crucial for security.
            // We only set the claim if it doesn't exist, preventing a Firestore
            // role change from being propagated to the token on re-login.
            // The authoritative source for roles is the token itself.
            const { customClaims } = await adminAuth.getUser(createdUser.uid);
            if (!customClaims || !customClaims.role) {
                await adminAuth.setCustomUserClaims(createdUser.uid, { role: createdUser.role });
            }
        } catch (error) {
            console.error(`Failed to set custom claims for user ${createdUser.uid}:`, error);
            // This is a critical error, but we might not want to fail the whole process.
            // For now, we'll log it. In a production system, we might add it to a retry queue.
        }
    }

    return createdUser;
  }
}
