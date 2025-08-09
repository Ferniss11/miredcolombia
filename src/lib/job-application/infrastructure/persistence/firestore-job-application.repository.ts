// src/lib/job-application/infrastructure/persistence/firestore-job-application.repository.ts
import type { JobApplication } from '../../domain/job-application.entity';
import type { JobApplicationRepository } from '../../domain/job-application.repository';
import { adminDb, adminInstance } from '@/lib/firebase/admin-config';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

const APPLICATIONS_COLLECTION = 'jobApplications';

const toJobApplication = (doc: QueryDocumentSnapshot<DocumentData>): JobApplication => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        applicationDate: data.applicationDate.toDate(),
    } as JobApplication;
};

export class FirestoreJobApplicationRepository implements JobApplicationRepository {
    private getDb() {
        if (!adminDb) throw new Error('Firestore not initialized');
        return adminDb;
    }

    async create(application: Omit<JobApplication, 'id'>): Promise<JobApplication> {
        const db = this.getDb();
        const docRef = await db.collection(APPLICATIONS_COLLECTION).add(application);
        const newDoc = await docRef.get();
        return toJobApplication(newDoc as QueryDocumentSnapshot);
    }
    
    async findByCandidateId(candidateId: string): Promise<JobApplication[]> {
        const db = this.getDb();
        const snapshot = await db.collection(APPLICATIONS_COLLECTION)
            .where('candidateId', '==', candidateId)
            .orderBy('applicationDate', 'desc')
            .get();
        return snapshot.docs.map(toJobApplication);
    }

    async findByJobId(jobId: string): Promise<JobApplication[]> {
        const db = this.getDb();
        const snapshot = await db.collection(APPLICATIONS_COLLECTION)
            .where('jobId', '==', jobId)
            .orderBy('applicationDate', 'desc')
            .get();
        return snapshot.docs.map(toJobApplication);
    }

    async findExistingApplication(candidateId: string, jobId: string): Promise<JobApplication | null> {
        const db = this.getDb();
        const snapshot = await db.collection(APPLICATIONS_COLLECTION)
            .where('candidateId', '==', candidateId)
            .where('jobId', '==', jobId)
            .limit(1)
            .get();
        
        if (snapshot.empty) {
            return null;
        }
        return toJobApplication(snapshot.docs[0]);
    }
    
    async updateStatus(applicationId: string, status: JobApplication['status']): Promise<JobApplication> {
        const db = this.getDb();
        const docRef = db.collection(APPLICATIONS_COLLECTION).doc(applicationId);
        await docRef.update({ status });
        const updatedDoc = await docRef.get();
        return toJobApplication(updatedDoc as QueryDocumentSnapshot);
    }
}
