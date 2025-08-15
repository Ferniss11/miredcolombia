// src/lib/job-application/infrastructure/api/job-application.controller.ts
import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/platform/api/api-response';
import { adminAuth } from '@/lib/firebase/admin-config';
import type { UserRole } from '@/lib/user/domain/user.entity';

// Repositories
import { FirestoreJobApplicationRepository } from '../persistence/firestore-job-application.repository';
import { FirestoreUserRepository } from '@/lib/user/infrastructure/persistence/firestore-user.repository';
import { FirestoreJobPostingRepository } from '@/lib/job-posting/infrastructure/persistence/firestore-job-posting.repository';

// Use Cases
import { ApplyToJobUseCase } from '../../application/apply-to-job.use-case';
import { GetApplicationsForJobUseCase } from '../../application/get-applications-for-job.use-case';


export class JobApplicationController {
  private applyToJobUseCase: ApplyToJobUseCase;
  private getApplicationsForJobUseCase: GetApplicationsForJobUseCase;

  constructor() {
    const applicationRepository = new FirestoreJobApplicationRepository();
    const userRepository = new FirestoreUserRepository();
    const jobRepository = new FirestoreJobPostingRepository();
    
    this.applyToJobUseCase = new ApplyToJobUseCase(applicationRepository, userRepository, jobRepository);
    this.getApplicationsForJobUseCase = new GetApplicationsForJobUseCase(applicationRepository, jobRepository);
  }

  async apply(req: NextRequest, { params }: { params: { jobId: string } }): Promise<ApiResponse> {
    const { jobId } = params;
    
    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) return ApiResponse.unauthorized();
    
    const { uid: candidateId } = await adminAuth.verifyIdToken(idToken);
    
    const newApplication = await this.applyToJobUseCase.execute({ jobId, candidateId });
    return ApiResponse.created(newApplication);
  }

  async getForJob(req: NextRequest, { params }: { params: { jobId: string } }): Promise<ApiResponse> {
    const { jobId } = params;

    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) return ApiResponse.unauthorized();
    const { uid: actorId } = await adminAuth.verifyIdToken(idToken);

    // The use case will handle authorization (checking if actorId is the job owner)
    const applications = await this.getApplicationsForJobUseCase.execute({ jobId, actorId });
    
    return ApiResponse.success(applications);
  }
}
