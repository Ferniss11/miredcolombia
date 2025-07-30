import { JobPosting } from "../../domain/job-posting.entity";
import { JobPostingRepository } from "../../domain/job-posting.repository";
import { adminDb, adminInstance } from "../../../firebase/admin-config";
import { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

const JOB_POSTINGS_COLLECTION = 'jobPostings';
const BUCKET_NAME = process.env.FIREBASE_STORAGE_BUCKET || 'gs://miredcolombia.appspot.com';

// Helper to convert Firestore Timestamps to JS Dates in a nested object
const convertTimestampsToDates = (data: DocumentData): any => {
    const newData: { [key: string]: any } = {};
    for (const key in data) {
        const value = data[key];
        if (value && typeof value.toDate === 'function') { // Check if it's a Firestore Timestamp
            newData[key] = value.toDate();
        } else {
            newData[key] = value;
        }
    }
    return newData;
};

export class FirestoreJobPostingRepository implements JobPostingRepository {

  private toJobPosting(doc: QueryDocumentSnapshot<DocumentData>): JobPosting {
    const data = doc.data();
    const convertedData = convertTimestampsToDates(data);
    return {
        ...convertedData,
        id: doc.id,
    } as JobPosting;
  }

  async save(job: JobPosting): Promise<JobPosting> {
    if (!adminDb) {
      throw new Error('Firestore not initialized');
    }
    const jobRef = job.id ? adminDb.collection(JOB_POSTINGS_COLLECTION).doc(job.id) : adminDb.collection(JOB_POSTINGS_COLLECTION).doc();
    
    // Ensure dates are JS Dates before setting
    const jobToSave = {
        ...job,
        id: jobRef.id,
        createdAt: job.createdAt || new Date(),
        updatedAt: new Date(),
    };

    await jobRef.set(jobToSave, { merge: true });
    return jobToSave;
  }

  async findById(id: string): Promise<JobPosting | null> {
    if (!adminDb) {
      throw new Error('Firestore not initialized');
    }
    const doc = await adminDb.collection(JOB_POSTINGS_COLLECTION).doc(id).get();
    if (!doc.exists) {
        return null;
    }
    return this.toJobPosting(doc as QueryDocumentSnapshot<DocumentData>);
  }

  async findAll(): Promise<JobPosting[]> {
    if (!adminDb) {
      throw new Error('Firestore not initialized');
    }
    const snapshot = await adminDb.collection(JOB_POSTINGS_COLLECTION).get();
    return snapshot.docs.map(this.toJobPosting);
  }

  async delete(id: string): Promise<void> {
    if (!adminDb) {
      throw new Error('Firestore not initialized');
    }
    await adminDb.collection(JOB_POSTINGS_COLLECTION).doc(id).delete();
  }

  async update(id: string, jobData: Partial<JobPosting>): Promise<JobPosting> {
    if (!adminDb) {
      throw new Error('Firestore not initialized');
    }
    const jobRef = adminDb.collection(JOB_POSTINGS_COLLECTION).doc(id);
    
    const dataToUpdate = {
        ...jobData,
        updatedAt: new Date()
    };

    await jobRef.update(dataToUpdate);
    const doc = await jobRef.get();
    return this.toJobPosting(doc as QueryDocumentSnapshot<DocumentData>);
  }
}