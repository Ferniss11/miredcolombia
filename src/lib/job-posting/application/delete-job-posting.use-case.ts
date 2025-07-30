import { JobPostingRepository } from "../domain/job-posting.repository";

export class DeleteJobPostingUseCase {
  constructor(private readonly jobPostingRepository: JobPostingRepository) {}

  async execute(id: string): Promise<void> {
    await this.jobPostingRepository.delete(id);
  }
}
