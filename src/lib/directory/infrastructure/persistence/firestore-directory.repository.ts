// src/lib/directory/infrastructure/persistence/firestore-directory.repository.ts
import { adminDb, adminInstance } from '@/lib/firebase/admin-config';
import type { DocumentData, QueryDocumentSnapshot, DocumentSnapshot } from 'firebase-admin/firestore';
import type { Business } from '../../domain/business.entity';
import type { DirectoryRepository } from '../../domain/directory.repository';

const DIRECTORY_COLLECTION = 'directory';

// Helper to convert Firestore Timestamps to JS Dates in a nested object
const convertTimestamps = (data: DocumentData): any => {
    if (!data) return data;
    const newData: { [key: string]: any } = {};
    for (const key in data) {
        const value = data[key];
        if (value && typeof value.toDate === 'function') { // Check if it's a Firestore Timestamp
            newData[key] = value.toDate();
        } else if (value && typeof value === 'object' && !Array.isArray(value) && value !== null) {
            newData[key] = convertTimestamps(value); // Recursively convert nested objects
        } else {
            newData[key] = value;
        }
    }
    return newData;
};


/**
 * A Firestore-backed implementation of the DirectoryRepository port.
 * This adapter handles all direct communication with the Firestore database
 * for the business directory.
 */
export class FirestoreDirectoryRepository implements DirectoryRepository {
    private getDb() {
        if (!adminDb || !adminInstance.firestore) {
            throw new Error('Firestore is not initialized.');
        }
        return adminDb;
    }

    private toBusiness(doc: DocumentSnapshot<DocumentData>): Business {
        const data = doc.data();
        if (!data) throw new Error("Document data is undefined for doc id: " + doc.id);
        const convertedData = convertTimestamps(data);
        return {
            id: doc.id,
            ...convertedData,
        } as Business;
    }
    
    async save(business: Business): Promise<void> {
        const db = this.getDb();
        const docRef = db.collection(DIRECTORY_COLLECTION).doc(business.id);
        await docRef.set(business, { merge: true });
    }

    async findById(id: string): Promise<Business | null> {
        const db = this.getDb();
        const docSnap = await db.collection(DIRECTORY_COLLECTION).doc(id).get();
        if (!docSnap.exists) {
            return null;
        }
        return this.toBusiness(docSnap);
    }
    
    async findAll(onlyApproved?: boolean | undefined): Promise<Business[]> {
        const db = this.getDb();
        let query: FirebaseFirestore.Query<DocumentData> = db.collection(DIRECTORY_COLLECTION);
        
        if (onlyApproved) {
            query = query.where('verificationStatus', '==', 'approved');
        } else {
            query = query.orderBy('createdAt', 'desc');
        }

        const snapshot = await query.get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => this.toBusiness(doc));
    }
    
    async delete(id: string): Promise<void> {
        const db = this.getDb();
        await db.collection(DIRECTORY_COLLECTION).doc(id).delete();
    }

    async update(id: string, data: Partial<Business>): Promise<Business> {
        const db = this.getDb();
        const docRef = db.collection(DIRECTORY_COLLECTION).doc(id);
        
        const dataToUpdate = {
            ...data,
            updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
        };

        await docRef.update(dataToUpdate);
        
        const updatedDoc = await docRef.get();
        if (!updatedDoc.exists) {
            throw new Error(`Failed to update. Document with id ${id} not found.`);
        }
        return this.toBusiness(updatedDoc);
    }
}
