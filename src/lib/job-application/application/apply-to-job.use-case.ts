// src/lib/job-application/application/apply-to-job.use-case.ts
import type { JobApplication } from '../domain/job-application.entity';
import type { JobApplicationRepository } from '../domain/job-application.repository';
import type { UserRepository } from '@/lib/user/domain/user.repository';
import type { JobPostingRepository } from '@/lib/job-posting/domain/job-posting.repository';

export type ApplyToJobInput = {
  jobId: string;
  candidateId: string;
};

export class ApplyToJobUseCase {
  constructor(
    private readonly applicationRepository: JobApplicationRepository,
    private readonly userRepository: UserRepository,
    private readonly jobRepository: JobPostingRepository
  ) {}

  async execute({ jobId, candidateId }: ApplyToJobInput): Promise<JobApplication> {
    // 1. Check if candidate has a complete profile
    const candidate = await this.userRepository.findByUid(candidateId);
    if (!candidate || !candidate.candidateProfile || !candidate.candidateProfile.resumeUrl) {
      throw new Error('Tu perfil de candidato está incompleto. Por favor, súbelo antes de aplicar.');
    }
    
    // 2. Check if candidate has already applied
    const existingApplication = await this.applicationRepository.findExistingApplication(candidateId, jobId);
    if (existingApplication) {
      throw new Error('Ya has aplicado a esta oferta de empleo.');
    }
    
    // 3. Get job details to store denormalized data
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new Error('La oferta de empleo no existe.');
    }
    
    // 4. Create the application
    const newApplication: Omit<JobApplication, 'id'> = {
      jobId,
      jobTitle: job.title,
      candidateId,
      advertiserId: job.creatorId,
      applicationDate: new Date(),
      status: 'received',
      profileSnapshot: candidate.candidateProfile,
    };

    return this.applicationRepository.create(newApplication);
  }
}
