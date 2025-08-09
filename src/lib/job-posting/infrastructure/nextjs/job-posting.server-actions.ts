
"use server";

import { CreateJobPostingUseCase } from "../../application/create-job-posting.use-case";
import { GetJobPostingsUseCase } from "../../application/get-job-postings.use-case";
import { DeleteJobPostingUseCase } from "../../application/delete-job-posting.use-case";
import { UpdateJobPostingUseCase } from "../../application/update-job-posting.use-case";
import { FirestoreJobPostingRepository } from "../persistence/firestore-job-posting.repository";
import { JobPosting } from "../../domain/job-posting.entity";
import { uploadImageToStorage } from "../storage/firebase-storage.adapter";
import { getJobPostingByIdAction as getJobPostingByIdActionInternal } from "./job-posting.server-actions";

const jobPostingRepository = new FirestoreJobPostingRepository();

// Helper to serialize JobPosting dates for client components
const serializeJobPosting = (job: JobPosting): any => ({
  ...job,
  createdAt: job.createdAt.toISOString(),
  updatedAt: job.updatedAt.toISOString(),
  applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().split('T')[0] : undefined,
});

type CreateJobPostingClientData = Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt' | 'imageUrl' | 'companyLogoUrl'>;

export async function createJobPostingAction(
  jobData: Partial<CreateJobPostingClientData>, // Make it partial to accommodate guest posts
  imageFile?: File,
  companyLogoFile?: File
) {
  try {
    const isGuestPost = !jobData.creatorId;

    const completeJobData: Omit<JobPosting, 'id' | 'imageUrl' | 'companyLogoUrl'> = {
      ...jobData,
      title: jobData.title!,
      description: jobData.description!,
      companyName: jobData.companyName!,
      location: jobData.location!,
      locationType: jobData.locationType!,
      jobType: jobData.jobType!,
      creatorId: isGuestPost ? jobData.applicationEmail! : jobData.creatorId!,
      creatorRole: isGuestPost ? 'guest' : jobData.creatorRole!,
      status: isGuestPost ? 'PENDING_REVIEW' : jobData.status || 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    

    const uploadPathId = isGuestPost ? `guest-${Date.now()}` : jobData.creatorId!;

    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      completeJobData.imageUrl = await uploadImageToStorage(buffer, `job-postings/${uploadPathId}/${Date.now()}-${imageFile.name}`, imageFile.type);
    }

    if (companyLogoFile) {
      const buffer = Buffer.from(await companyLogoFile.arrayBuffer());
      completeJobData.companyLogoUrl = await uploadImageToStorage(buffer, `job-postings/${uploadPathId}/${Date.now()}-logo-${companyLogoFile.name}`, companyLogoFile.type);
    }

    const createUseCase = new CreateJobPostingUseCase(jobPostingRepository);
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

export async function getJobPostingByIdAction(id: string) {
    try {
        const job = await jobPostingRepository.findById(id);
        if (!job) {
            return { success: false, error: "Job posting not found." };
        }
        return { success: true, data: serializeJobPosting(job) };
    } catch (error: any) {
        console.error(`Error fetching job posting with id ${id}:`, error);
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
  jobData: Partial<Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt' | 'imageUrl' | 'companyLogoUrl'>>,
  imageFile?: File,
  companyLogoFile?: File
) {
  try {
    const dataToUpdate: Partial<JobPosting> = { ...jobData };

    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      dataToUpdate.imageUrl = await uploadImageToStorage(buffer, `job-postings/${id}/${Date.now()}-${imageFile.name}`, imageFile.type);
    }

    if (companyLogoFile) {
      const buffer = Buffer.from(await companyLogoFile.arrayBuffer());
      dataToUpdate.companyLogoUrl = await uploadImageToStorage(buffer, `job-postings/${id}/${Date.now()}-logo-${companyLogoFile.name}`, companyLogoFile.type);
    }

    const updateUseCase = new UpdateJobPostingUseCase(jobPostingRepository);
    const updatedJob = await updateUseCase.execute(id, dataToUpdate);
    return { success: true, data: serializeJobPosting(updatedJob) };
  } catch (error: any) {
    console.error("Error updating job posting:", error);
    return { success: false, error: error.message };
  }
}

// --- Public Facing Actions ---

export async function getPublicJobPostingsAction() {
  try {
    const getUseCase = new GetJobPostingsUseCase(jobPostingRepository);
    const allJobPostings = await getUseCase.execute();
    
    // Filter for only active job postings
    const activeJobPostings = allJobPostings.filter(job => job.status === 'ACTIVE');
    
    const serializableJobPostings = activeJobPostings.map(serializeJobPosting);
    return { success: true, data: serializableJobPostings };
  } catch (error: any) {
    console.error("Error fetching public job postings:", error);
    return { success: false, error: error.message };
  }
}

export async function getPublicJobPostingByIdAction(id: string) {
    try {
        const job = await jobPostingRepository.findById(id);
        
        if (!job) {
             return { success: false, error: "Job posting not found." };
        }

        // Ensure only active jobs are publicly visible
        if (job.status !== 'ACTIVE') {
            return { success: false, error: "This job posting is not currently active." };
        }
        
        return { success: true, data: serializeJobPosting(job) };
    } catch (error: any) {
        console.error(`Error fetching public job posting with id ${id}:`, error);
        return { success: false, error: error.message };
    }
}
