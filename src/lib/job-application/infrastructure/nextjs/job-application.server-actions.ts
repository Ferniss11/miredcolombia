// src/lib/job-application/infrastructure/nextjs/job-application.server-actions.ts
'use server';

import { revalidatePath } from "next/cache";
import { GetApplicationsForUserUseCase } from "../../application/get-applications-for-user.use-case";
import { FirestoreJobApplicationRepository } from "../persistence/firestore-job-application.repository";
import type { JobApplication } from "../../domain/job-application.entity";

// Helper to serialize JobPosting dates for client components
const serializeApplication = (app: JobApplication): any => ({
  ...app,
  applicationDate: app.applicationDate.toISOString(),
});

export async function getApplicationsForUserAction(candidateId: string) {
  try {
    const applicationRepository = new FirestoreJobApplicationRepository();
    const useCase = new GetApplicationsForUserUseCase(applicationRepository);
    const applications = await useCase.execute({ candidateId });
    return { success: true, data: applications.map(serializeApplication) };
  } catch (error: any) {
    console.error("Error fetching user applications:", error);
    return { success: false, error: error.message };
  }
}
