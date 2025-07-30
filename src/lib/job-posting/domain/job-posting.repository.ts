import { JobPosting } from "./job-posting.entity";

export interface JobPostingRepository {
  save(job: JobPosting): Promise<JobPosting>;
  findById(id: string): Promise<JobPosting | null>;
  findAll(): Promise<JobPosting[]>;
  delete(id: string): Promise<void>;
  update(id: string, jobData: Partial<JobPosting>): Promise<JobPosting>;
}
