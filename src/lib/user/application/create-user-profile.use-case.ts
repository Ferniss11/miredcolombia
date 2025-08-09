// application/create-user-profile.use-case.ts
import { User, UserRole } from '../domain/user.entity';
import { UserRepository } from '../domain/user.repository';
import { adminAuth } from '@/lib/firebase/admin-config';

export type CreateUserInput = {
  uid: string;
  name: string;
  email: string;
  role: Exclude<UserRole, 'Guest'>; // Guests don't have profiles
};

export class CreateUserProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    const now = new Date();
    const newUser: User = {
      ...input,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    const createdUser = await this.userRepository.create(newUser);

    if (adminAuth) {
        try {
            const { customClaims } = await adminAuth.getUser(createdUser.uid);
            
            // The roles to be set on the token.
            const newClaims: { roles: UserRole[] } = { roles: [createdUser.role] };

            // Special check for Super Admin.
            if (createdUser.email === 'caangogi@gmail.com') {
                if (!newClaims.roles.includes('SAdmin')) {
                    newClaims.roles.push('SAdmin');
                }
            }

            // We only set claims if they don't exist or if they are different from what we want to set.
            // This prevents unnecessary writes.
            const existingRoles = (customClaims?.roles || []) as UserRole[];
            const rolesAreDifferent = existingRoles.length !== newClaims.roles.length || 
                                    !newClaims.roles.every(role => existingRoles.includes(role));

            if (rolesAreDifferent) {
                 await adminAuth.setCustomUserClaims(createdUser.uid, newClaims);
            }
           
        } catch (error) {
            console.error(`Failed to set custom claims for user ${createdUser.uid}:`, error);
        }
    }

    return createdUser;
  }
}
