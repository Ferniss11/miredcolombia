// application/set-user-role.use-case.ts
import { adminAuth } from '@/lib/firebase/admin-config';
import { UserRole } from '../domain/user.entity';
import { UserRepository } from '../domain/user.repository';

export type SetUserRoleInput = {
  targetUid: string;
  newRole: UserRole;
};

export class SetUserRoleUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({ targetUid, newRole }: SetUserRoleInput): Promise<void> {
    if (newRole === 'SAdmin') {
        throw new Error("The SAdmin role cannot be assigned manually.");
    }

    if (!adminAuth) {
      throw new Error('Firebase Admin Auth is not initialized.');
    }

    // Step 1: Update the user's role in Firestore.
    // This is important for display purposes and for syncing if claims are ever lost.
    await this.userRepository.update(targetUid, { role: newRole });

    // Step 2: Update the custom claims on the user's auth token.
    // This is the source of truth for security rules and backend checks.
    const { customClaims } = await adminAuth.getUser(targetUid);
    const newClaims = {
        ...customClaims,
        roles: [newRole], // Set the new role in an array
    };
    
    // Check for the super admin email and preserve the SAdmin role if it exists
    const userRecord = await adminAuth.getUser(targetUid);
    if (userRecord.email === 'caangogi@gmail.com' && !newClaims.roles.includes('SAdmin')) {
        newClaims.roles.push('SAdmin');
    }
    
    await adminAuth.setCustomUserClaims(targetUid, newClaims);
  }
}
