// src/lib/user/application/sync-user-role.use-case.ts
import { adminAuth } from '@/lib/firebase/admin-config';
import type { UserRepository } from '../domain/user.repository';
import type { UserRole } from '../domain/user.entity';

/**
 * Use case to synchronize a user's role from Firestore to their Firebase Auth custom claims.
 * This is particularly useful for legacy users who might not have their roles set in their token.
 */
export class SyncUserRoleUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(uid: string): Promise<void> {
    if (!adminAuth) {
      throw new Error('Firebase Admin Auth is not initialized.');
    }

    const userProfile = await this.userRepository.findByUid(uid);
    if (!userProfile || !userProfile.role) {
      console.warn(`[SyncUserRoleUseCase] User ${uid} or their role not found in Firestore. Skipping sync.`);
      return;
    }

    const { customClaims } = await adminAuth.getUser(uid);
    const existingRoles = (customClaims?.roles || []) as UserRole[];

    // Only update claims if the role is not already present
    if (!existingRoles.includes(userProfile.role)) {
        const newRoles = [...existingRoles, userProfile.role];
        await adminAuth.setCustomUserClaims(uid, { ...customClaims, roles: newRoles });
        console.log(`[SyncUserRoleUseCase] Synced role '${userProfile.role}' to custom claims for user ${uid}.`);
    }
  }
}
