"use server";

import { CreateJobPostingUseCase } from "../../application/create-job-posting.use-case";
import { GetJobPostingsUseCase } from "../../application/get-job-postings.use-case";
import { DeleteJobPostingUseCase } from "../../application/delete-job-posting.use-case";
import { UpdateJobPostingUseCase } from "../../application/update-job-posting.use-case";
import { FirestoreJobPostingRepository } from "../persistence/firestore-job-posting.repository";
import { JobPosting } from "../../domain/job-posting.entity";
import { uploadImageToStorage } from "../storage/firebase-storage.adapter";

const jobPostingRepository = new FirestoreJobPostingRepository();

// Helper to serialize JobPosting dates for client components
const serializeJobPosting = (job: JobPosting) => ({
  ...job,
  createdAt: job.createdAt.toISOString(),
  updatedAt: job.updatedAt.toISOString(),
  applicationDeadline: job.applicationDeadline ? job.applicationDeadline.toString() : undefined,
});

type CreateJobPostingClientData = Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt' | 'imageUrl' | 'companyLogoUrl'>;

export async function createJobPostingAction(
  jobData: CreateJobPostingClientData,
  imageFile?: File,
  companyLogoFile?: File
) {
  try {
    let imageUrl: string | undefined;
    let companyLogoUrl: string | undefined;

    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      imageUrl = await uploadImageToStorage(buffer, `job-postings/${jobData.creatorId}/${Date.now()}-${imageFile.name}`, imageFile.type);
    }

    if (companyLogoFile) {
      const buffer = Buffer.from(await companyLogoFile.arrayBuffer());
      companyLogoUrl = await uploadImageToStorage(buffer, `job-postings/${jobData.creatorId}/${Date.now()}-logo-${companyLogoFile.name}`, companyLogoFile.type);
    }

    const createUseCase = new CreateJobPostingUseCase(jobPostingRepository);

    const completeJobData: Omit<JobPosting, 'id'> = {
      ...jobData,
      imageUrl,
      companyLogoUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newJob = await createUseCase.execute(completeJobData);
    return { success: true, data: serializeJobPosting(newJob) };
  } catch (error: any) {
    console.error("Error creating job posting:", error);
    return { success: false, error: error.message };
  }
}

export async function getJobPostingsAction() {
  try {
    const getUseCase = new GetJobPostingsUseCase(jobPostingRepository);
    const jobPostings = await getUseCase.execute();
    const serializableJobPostings = jobPostings.map(serializeJobPosting);
    return { success: true, data: serializableJobPostings };
  } catch (error: any) {
    console.error("Error fetching job postings:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteJobPostingAction(id: string) {
  try {
    const deleteUseCase = new DeleteJobPostingUseCase(jobPostingRepository);
    await deleteUseCase.execute(id);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting job posting:", error);
    return { success: false, error: error.message };
  }
}

export async function updateJobPostingAction(
  id: string,
  jobData: Partial<Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt' | 'imageUrl' | 'companyLogoUrl'>
  >,
  imageFile?: File,
  companyLogoFile?: File
) {
  try {
    let imageUrl: string | undefined;
    let companyLogoUrl: string | undefined;

    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      imageUrl = await uploadImageToStorage(buffer, `job-postings/${id}/${Date.now()}-${imageFile.name}`, imageFile.type);
    }

    if (companyLogoFile) {
      const buffer = Buffer.from(await companyLogoFile.arrayBuffer());
      companyLogoUrl = await uploadImageToStorage(buffer, `job-postings/${id}/${Date.now()}-logo-${companyLogoFile.name}`, companyLogoFile.type);
    }

    const updateUseCase = new UpdateJobPostingUseCase(jobPostingRepository);
    const updatedJob = await updateUseCase.execute(id, {
      ...jobData,
      imageUrl,
      companyLogoUrl,
    });
    return { success: true, data: serializeJobPosting(updatedJob) };
  } catch (error: any) {
    console.error("Error updating job posting:", error);
    return { success: false, error: error.message };
  }
}