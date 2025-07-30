import { JobPosting } from "../domain/job-posting.entity";
import { JobPostingRepository } from "../domain/job-posting.repository";

export class CreateJobPostingUseCase {
  constructor(private readonly jobPostingRepository: JobPostingRepository) {}

  async execute(jobData: Omit<JobPosting, 'id'>): Promise<JobPosting> {
    // The use case now receives the complete data, including server-generated fields.
    // It's responsible for creating the final entity object.
    const newJob: JobPosting = {
      ...jobData,
      id: '', // The repository/database will set the final ID
    } as JobPosting;

    return this.jobPostingRepository.save(newJob);
  }
}
