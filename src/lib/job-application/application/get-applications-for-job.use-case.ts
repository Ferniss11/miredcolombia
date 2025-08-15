// src/lib/job-application/application/get-applications-for-job.use-case.ts
import type { JobApplication } from '../domain/job-application.entity';
import type { JobApplicationRepository } from '../domain/job-application.repository';
import type { JobPostingRepository } from '@/lib/job-posting/domain/job-posting.repository';

export type GetApplicationsForJobInput = {
  jobId: string;
  actorId: string; // The ID of the user requesting the data, for authorization
};

/**
 * Use case for retrieving all applications for a specific job posting.
 * Includes an authorization check to ensure only the job owner can view them.
 */
export class GetApplicationsForJobUseCase {
  constructor(
    private readonly applicationRepository: JobApplicationRepository,
    private readonly jobRepository: JobPostingRepository
  ) {}

  async execute({ jobId, actorId }: GetApplicationsForJobInput): Promise<JobApplication[]> {
    // 1. Authorization: Check if the actor is the owner of the job.
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new Error('Job posting not found.');
    }
    
    // In a real-world scenario with more roles, this check would be more complex.
    // For now, we allow the job creator (admin or advertiser) to see the applications.
    if (job.creatorId !== actorId) {
      throw new Error('Forbidden: You are not authorized to view applications for this job.');
    }

    // 2. Fetch the applications
    return this.applicationRepository.findByJobId(jobId);
  }
}
