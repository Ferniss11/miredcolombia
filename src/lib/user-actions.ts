
'use server';

import { z } from 'zod';
import { adminAuth } from '@/lib/firebase/admin-config';
import { GetUserProfileUseCase } from '@/lib/user/application/get-user-profile.use-case';
import { FirestoreUserRepository } from '@/lib/user/infrastructure/persistence/firestore-user.repository';
import { SetUserRoleUseCase } from '@/lib/user/application/set-user-role.use-case';
import type { UserRole } from '@/lib/user/domain/user.entity';
import { revalidatePath } from 'next/cache';
import { uploadFile } from './user/infrastructure/storage/firebase-storage.adapter';
import { UpdateCandidateProfileUseCase } from './user/application/update-candidate-profile.use-case';

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


export async function updateCandidateProfileAction(uid: string, formData: FormData) {
    try {
        const userRepository = new FirestoreUserRepository();
        const updateUseCase = new UpdateCandidateProfileUseCase(userRepository);

        const resumeFile = formData.get('resumeFile') as File | null;
        let resumeUrl: string | undefined = undefined;

        if (resumeFile && resumeFile.size > 0) {
            const buffer = Buffer.from(await resumeFile.arrayBuffer());
            const filePath = `resumes/${uid}/${resumeFile.name}`;
            resumeUrl = await uploadFile(buffer, filePath, resumeFile.type);
        }

        const skillsString = formData.get('skills') as string;
        const skillsArray = skillsString ? skillsString.split(',').map(s => s.trim()) : [];

        const profileData = {
            professionalTitle: formData.get('professionalTitle') as string,
            summary: formData.get('summary') as string,
            skills: skillsArray,
            ...(resumeUrl && { resumeUrl: resumeUrl }),
        };

        await updateUseCase.execute(uid, profileData);
        revalidatePath('/dashboard/candidate-profile');
        return { success: true };

    } catch (error) {
        console.error("Error updating candidate profile:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}
