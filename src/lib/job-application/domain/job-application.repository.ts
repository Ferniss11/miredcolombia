// src/lib/job-application/domain/job-application.repository.ts
import type { JobApplication } from './job-application.entity';

export interface JobApplicationRepository {
  /**
   * Creates a new job application record in the database.
   * @param application - The application entity to create.
   * @returns The created application entity.
   */
  create(application: Omit<JobApplication, 'id'>): Promise<JobApplication>;

  /**
   * Finds all applications submitted by a specific candidate.
   * @param candidateId - The UID of the candidate.
   * @returns An array of JobApplication entities.
   */
  findByCandidateId(candidateId: string): Promise<JobApplication[]>;
  
  /**
   * Finds all applications for a specific job posting.
   * @param jobId - The ID of the job posting.
   * @returns An array of JobApplication entities.
   */
  findByJobId(jobId: string): Promise<JobApplication[]>;
  
  /**
   * Checks if a specific candidate has already applied to a specific job.
   * @param candidateId - The UID of the candidate.
   * @param jobId - The ID of the job posting.
   * @returns The existing application if found, otherwise null.
   */
  findExistingApplication(candidateId: string, jobId: string): Promise<JobApplication | null>;
  
  /**
   * Updates the status of a specific application.
   * @param applicationId - The ID of the application to update.
   * @param status - The new status.
   * @returns The updated application entity.
   */
  updateStatus(applicationId: string, status: JobApplication['status']): Promise<JobApplication>;
}
