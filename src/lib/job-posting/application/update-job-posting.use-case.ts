import { JobPosting } from "../domain/job-posting.entity";
import { JobPostingRepository } from "../domain/job-posting.repository";

export class UpdateJobPostingUseCase {
  constructor(private readonly jobPostingRepository: JobPostingRepository) {}

  async execute(id: string, jobData: Partial<JobPosting>): Promise<JobPosting> {
    return this.jobPostingRepository.update(id, jobData);
  }
}
