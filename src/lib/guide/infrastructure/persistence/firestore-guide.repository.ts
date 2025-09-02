// src/lib/guide/infrastructure/persistence/firestore-guide.repository.ts
import type { Guide } from '../../domain/guide.entity';
import type { GuideRepository } from '../../domain/guide.repository';
import { adminDb } from '@/lib/firebase/admin-config';
import type { DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase-admin/firestore';

const GUIDES_COLLECTION = 'guides';

const toGuide = (doc: DocumentSnapshot): Guide => {
    const data = doc.data() as DocumentData;
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
    } as Guide;
}

export class FirestoreGuideRepository implements GuideRepository {
    private getDb() {
        if (!adminDb) throw new Error('Firestore not initialized');
        return adminDb;
    }

    async create(guideData: Omit<Guide, 'id'>): Promise<Guide> {
        const db = this.getDb();
        const docRef = await db.collection(GUIDES_COLLECTION).add(guideData);
        const newDoc = await docRef.get();
        return toGuide(newDoc);
    }

    async findById(id: string): Promise<Guide | null> {
        const db = this.getDb();
        const doc = await db.collection(GUIDES_COLLECTION).doc(id).get();
        if (!doc.exists) {
            return null;
        }
        return toGuide(doc);
    }

    async findAll(): Promise<Guide[]> {
        const db = this.getDb();
        const snapshot = await db.collection(GUIDES_COLLECTION).orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => toGuide(doc));
    }

    async update(id: string, data: Partial<Omit<Guide, 'id' | 'createdAt'>>): Promise<Guide> {
        const db = this.getDb();
        const docRef = db.collection(GUIDES_COLLECTION).doc(id);
        await docRef.update(data);
        const updatedDoc = await docRef.get();
        if (!updatedDoc.exists) {
            throw new Error('Failed to retrieve guide after update.');
        }
        return toGuide(updatedDoc);
    }

    async delete(id: string): Promise<void> {
        const db = this.getDb();
        await db.collection(GUIDES_COLLECTION).doc(id).delete();
    }
}
