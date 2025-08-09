// src/app/api/users/[uid]/candidate-profile/route.ts
import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { ApiResponse } from '@/lib/platform/api/api-response';

import { FirestoreUserRepository } from '@/lib/user/infrastructure/persistence/firestore-user.repository';
import { UpdateCandidateProfileUseCase } from '@/lib/user/application/update-candidate-profile.use-case';
import { uploadFile } from '@/lib/user/infrastructure/storage/firebase-storage.adapter';

const userRepository = new FirestoreUserRepository();
const updateCandidateProfileUseCase = new UpdateCandidateProfileUseCase(userRepository);

type RouteContext = { params: { uid: string } };

// This endpoint handles multipart/form-data
export const PUT = apiHandler(async (req: NextRequest, { params }: RouteContext) => {
    const { uid } = params;
    if (!uid) {
        return ApiResponse.badRequest('User ID is missing.');
    }

    try {
        const formData = await req.formData();
        const resumeFile = formData.get('resumeFile') as File | null;
        let resumeUrl: string | undefined = undefined;

        if (resumeFile) {
            const fileBuffer = Buffer.from(await resumeFile.arrayBuffer());
            const filePath = `resumes/${uid}/${resumeFile.name}`;
            resumeUrl = await uploadFile(fileBuffer, filePath, resumeFile.type);
        }
        
        const profileData = {
            professionalTitle: formData.get('professionalTitle') as string,
            summary: formData.get('summary') as string,
            skills: (formData.get('skills') as string)?.split(',').map(s => s.trim()).filter(Boolean),
            resumeUrl: resumeUrl,
        };

        // Filter out undefined values so we don't overwrite existing data with empty fields
        const cleanedData = Object.fromEntries(Object.entries(profileData).filter(([_, v]) => v !== undefined && v !== null));

        const updatedUser = await updateCandidateProfileUseCase.execute(uid, cleanedData);

        return ApiResponse.success(updatedUser);
    } catch (error) {
        console.error('Error updating candidate profile:', error);
        return ApiResponse.error(error instanceof Error ? error.message : 'An unknown error occurred.');
    }
}, ['User', 'Admin', 'SAdmin']);
