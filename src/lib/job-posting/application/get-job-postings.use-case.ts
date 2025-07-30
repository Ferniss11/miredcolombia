import { JobPosting } from "../domain/job-posting.entity";
import { JobPostingRepository } from "../domain/job-posting.repository";

export class GetJobPostingsUseCase {
  constructor(private readonly jobPostingRepository: JobPostingRepository) {}

  async execute(): Promise<JobPosting[]> {
    return this.jobPostingRepository.findAll();
  }
}
