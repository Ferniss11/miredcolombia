
'use server';

import { z } from 'zod';
import { adminAuth } from '@/lib/firebase/admin-config';
import { GetUserProfileUseCase } from '@/lib/user/application/get-user-profile.use-case';
import { FirestoreUserRepository } from '@/lib/user/infrastructure/persistence/firestore-user.repository';
import { SetUserRoleUseCase, type SetUserRoleInput } from '@/lib/user/application/set-user-role.use-case';
import type { UserRole } from '@/lib/user/domain/user.entity';
import { revalidatePath } from 'next/cache';

/**
 * A server action to securely synchronize a user's role from Firestore
 * to their Firebase Auth custom claims. This is intended to be called
 * during login for existing users who don't have the claim set yet.
 * @param uid The user's unique identifier.
 * @returns An object indicating success or failure.
 */
export async function syncUserRoleAction(uid: string): Promise<{ success: boolean; error?: string }> {
  if (!adminAuth) {
    return { success: false, error: 'Authentication service is not configured.' };
  }

  try {
    const userRepository = new FirestoreUserRepository();
    const getUserUseCase = new GetUserProfileUseCase(userRepository);
    const userProfile = await getUserUseCase.execute(uid);

    if (!userProfile) {
      return { success: false, error: 'User profile not found.' };
    }

    if (!userProfile.role) {
      return { success: false, error: 'User has no role defined in Firestore.' };
    }

    const { customClaims } = await adminAuth.getUser(uid);
    const existingRoles = (customClaims?.roles || []) as UserRole[];
    const newRoles: UserRole[] = [userProfile.role];
    
    // Add SAdmin role for the specific user
    if (userProfile.email === 'caangogi@gmail.com' && !newRoles.includes('SAdmin')) {
        newRoles.push('SAdmin');
    }

    const rolesAreDifferent = existingRoles.length !== newRoles.length || 
                              !newRoles.every(role => existingRoles.includes(role));
    
    if (rolesAreDifferent) {
        await adminAuth.setCustomUserClaims(uid, { roles: newRoles });
    }

    return { success: true };

  } catch (error) {
    console.error(`Failed to sync role for user ${uid}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}

const setUserRoleSchema = z.object({
  uid: z.string().min(1),
  role: z.enum(['Admin', 'Advertiser', 'User']), // SAdmin cannot be set manually
});

export async function setUserRoleAction(input: z.infer<typeof setUserRoleSchema>, actorId: string) {
    if (!adminAuth) {
        return { success: false, error: 'Authentication service is not configured.' };
    }

    try {
        // --- Authorization Check ---
        const actor = await adminAuth.getUser(actorId);
        const actorRoles = (actor.customClaims?.roles || []) as UserRole[];
        if (!actorRoles.includes('SAdmin')) {
            return { success: false, error: 'You are not authorized to perform this action.' };
        }

        const { uid, role } = setUserRoleSchema.parse(input);
        const userRepository = new FirestoreUserRepository();
        const setUserRoleUseCase = new SetUserRoleUseCase(userRepository);

        await setUserRoleUseCase.execute({ targetUid: uid, newRole: role });

        revalidatePath('/dashboard/admin/users');

        return { success: true };

    } catch (error) {
        console.error(`Failed to set role for user ${input.uid} by actor ${actorId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: errorMessage };
    }
}
