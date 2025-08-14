// src/lib/service-listing/infrastructure/persistence/firestore-service-listing.repository.ts
import type { ServiceListing } from '../../domain/service-listing.entity';
import type { ServiceListingRepository } from '../../domain/service-listing.repository';
import { adminDb, adminInstance } from '@/lib/firebase/admin-config';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

const SERVICES_COLLECTION = 'serviceListings';

const toServiceListing = (doc: QueryDocumentSnapshot | DocumentData): ServiceListing => {
    const data = doc.data();
    if (!data) throw new Error("Document data is undefined.");
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
    } as ServiceListing;
};

export class FirestoreServiceListingRepository implements ServiceListingRepository {
    private getDb() {
        if (!adminDb) throw new Error('Firestore not initialized');
        return adminDb;
    }

    async create(listing: Omit<ServiceListing, 'id'>): Promise<ServiceListing> {
        const db = this.getDb();
        const docRef = await db.collection(SERVICES_COLLECTION).add(listing);
        const newDoc = await docRef.get();
        return toServiceListing(newDoc);
    }

    async findById(id: string): Promise<ServiceListing | null> {
        const db = this.getDb();
        const doc = await db.collection(SERVICES_COLLECTION).doc(id).get();
        if (!doc.exists) {
            return null;
        }
        return toServiceListing(doc);
    }

    async findAll(): Promise<ServiceListing[]> {
        const db = this.getDb();
        const snapshot = await db.collection(SERVICES_COLLECTION).orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => toServiceListing(doc));
    }
    
    async findPublished(): Promise<ServiceListing[]> {
        const db = this.getDb();
        const snapshot = await db.collection(SERVICES_COLLECTION)
            .where('status', '==', 'published')
            .orderBy('createdAt', 'desc')
            .get();
        return snapshot.docs.map(doc => toServiceListing(doc));
    }

    async findByUserId(userId: string): Promise<ServiceListing[]> {
        const db = this.getDb();
        const snapshot = await db.collection(SERVICES_COLLECTION)
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();
        return snapshot.docs.map(doc => toServiceListing(doc));
    }

    async update(id: string, data: Partial<ServiceListing>): Promise<ServiceListing> {
        const db = this.getDb();
        const docRef = db.collection(SERVICES_COLLECTION).doc(id);
        await docRef.update({ ...data, updatedAt: new Date() });
        const updatedDoc = await docRef.get();
        return toServiceListing(updatedDoc);
    }

    async delete(id: string): Promise<void> {
        const db = this.getDb();
        await db.collection(SERVICES_COLLECTION).doc(id).delete();
    }
}
