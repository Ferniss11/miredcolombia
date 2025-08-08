'use server';

import { adminAuth } from '@/lib/firebase/admin-config';
import { GetUserProfileUseCase } from '@/lib/user/application/get-user-profile.use-case';
import { FirestoreUserRepository } from '@/lib/user/infrastructure/persistence/firestore-user.repository';

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

    // Get current claims to avoid unnecessary writes
    const { customClaims } = await adminAuth.getUser(uid);

    if (customClaims && customClaims.role === userProfile.role) {
      // The claim is already set and correct, no action needed.
      return { success: true };
    }

    // Set the custom claim based on the role from Firestore.
    await adminAuth.setCustomUserClaims(uid, { role: userProfile.role });

    return { success: true };

  } catch (error) {
    console.error(`Failed to sync role for user ${uid}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}
