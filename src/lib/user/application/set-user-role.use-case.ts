// application/set-user-role.use-case.ts
import { adminAuth } from '@/lib/firebase/admin-config';
import { UserRole } from '../domain/user.entity';
import { UserRepository } from '../domain/user.repository';

export type SetUserRoleInput = {
  targetUid: string;
  newRole: UserRole;
  actorUid: string; // The user performing the action
};

export class SetUserRoleUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({ targetUid, newRole, actorUid }: SetUserRoleInput): Promise<void> {
    if (!adminAuth) {
      throw new Error('Firebase Admin Auth is not initialized.');
    }
    
    // --- Authorization Check ---
    const actorRecord = await adminAuth.getUser(actorUid);
    const actorRoles = (actorRecord.customClaims?.roles || []) as UserRole[];
    if (!actorRoles.includes('SAdmin')) {
        throw new Error('Forbidden: You do not have permission to change user roles.');
    }
    
    if (newRole === 'SAdmin') {
        throw new Error("The SAdmin role cannot be assigned manually.");
    }
    
    // Prevent SAdmin from changing their own role
    if (actorUid === targetUid && actorRoles.includes('SAdmin') && newRole !== 'SAdmin') {
        throw new Error("Super Admin cannot change their own role.");
    }

    // Step 1: Update the user's role in Firestore.
    // This is important for display purposes and for syncing if claims are ever lost.
    await this.userRepository.update(targetUid, { role: newRole });

    // Step 2: Update the custom claims on the user's auth token.
    const { customClaims } = await adminAuth.getUser(targetUid);
    const newClaims = {
        ...customClaims,
        roles: [newRole], // Set the new role in an array
    };
    
    // Preserve SAdmin role if the target is the super admin, regardless of what's being set
    const targetRecord = await adminAuth.getUser(targetUid);
    if (targetRecord.email === 'caangogi@gmail.com' && !newClaims.roles.includes('SAdmin')) {
        newClaims.roles.push('SAdmin');
    }
    
    await adminAuth.setCustomUserClaims(targetUid, newClaims);
  }
}
