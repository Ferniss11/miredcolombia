// src/lib/job-application/application/get-applications-for-user.use-case.ts
import type { JobApplication } from '../domain/job-application.entity';
import type { JobApplicationRepository } from '../domain/job-application.repository';

export type GetApplicationsForUserInput = {
  candidateId: string;
};

/**
 * Use case for retrieving all applications for a specific candidate.
 */
export class GetApplicationsForUserUseCase {
  constructor(
    private readonly applicationRepository: JobApplicationRepository,
  ) {}

  async execute({ candidateId }: GetApplicationsForUserInput): Promise<JobApplication[]> {
    // Authorization is handled at the API/Action layer
    return this.applicationRepository.findByCandidateId(candidateId);
  }
}
