// src/lib/blog/infrastructure/persistence/firestore-blog.repository.ts
import { adminDb, adminInstance } from '@/lib/firebase/admin-config';
import type { DocumentData, QueryDocumentSnapshot, DocumentSnapshot } from 'firebase-admin/firestore';
import type { BlogPost } from '../../domain/blog-post.entity';
import type { BlogPostRepository } from '../../domain/blog.repository';

const POSTS_COLLECTION = 'posts';

// Helper to convert Firestore Timestamps to JS Dates in a nested object
const convertTimestamps = (data: DocumentData): any => {
    if (!data) return data;
    const newData: { [key: string]: any } = {};
    for (const key in data) {
        const value = data[key];
        if (value && typeof value.toDate === 'function') {
            newData[key] = value.toDate().toISOString(); // Convert to ISO string for client
        } else if (value && typeof value === 'object' && !Array.isArray(value) && value !== null) {
            newData[key] = convertTimestamps(value);
        } else {
            newData[key] = value;
        }
    }
    return newData;
};

export class FirestoreBlogPostRepository implements BlogPostRepository {
    private getDb() {
        if (!adminDb || !adminInstance.firestore) {
            throw new Error('Firestore is not initialized.');
        }
        return adminDb;
    }

    private toBlogPost(doc: DocumentSnapshot<DocumentData>): BlogPost {
        const data = doc.data();
        if (!data) throw new Error("Document data is undefined for doc id: " + doc.id);
        const convertedData = convertTimestamps(data);
        return {
            id: doc.id,
            ...convertedData,
        } as BlogPost;
    }

    async create(postData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogPost> {
        const db = this.getDb();
        const docRef = db.collection(POSTS_COLLECTION).doc();
        
        const dataToSave = {
            ...postData,
            createdAt: adminInstance.firestore.FieldValue.serverTimestamp(),
            updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
        };

        await docRef.set(dataToSave);
        const newDoc = await docRef.get();
        return this.toBlogPost(newDoc);
    }
    
    async findById(id: string): Promise<BlogPost | null> {
        const db = this.getDb();
        const doc = await db.collection(POSTS_COLLECTION).doc(id).get();
        if (!doc.exists) return null;
        return this.toBlogPost(doc);
    }

    async findBySlug(slug: string): Promise<BlogPost | null> {
        const db = this.getDb();
        const snapshot = await db.collection(POSTS_COLLECTION).where('slug', '==', slug).limit(1).get();
        if (snapshot.empty) return null;
        return this.toBlogPost(snapshot.docs[0]);
    }
    
    async findAll(): Promise<BlogPost[]> {
        const db = this.getDb();
        const snapshot = await db.collection(POSTS_COLLECTION).orderBy('date', 'desc').get();
        return snapshot.docs.map(doc => this.toBlogPost(doc));
    }

    async findPublished(): Promise<BlogPost[]> {
        const db = this.getDb();
        const snapshot = await db.collection(POSTS_COLLECTION)
            .where('status', '==', 'Published')
            .orderBy('date', 'desc')
            .get();
        return snapshot.docs.map(doc => this.toBlogPost(doc));
    }
    
    async update(id: string, data: Partial<BlogPost>): Promise<BlogPost> {
        const db = this.getDb();
        const docRef = db.collection(POSTS_COLLECTION).doc(id);
        
        const dataToUpdate = {
            ...data,
            updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
        };
        
        await docRef.update(dataToUpdate);
        const updatedDoc = await docRef.get();
        return this.toBlogPost(updatedDoc);
    }
    
    async delete(id: string): Promise<void> {
        const db = this.getDb();
        await db.collection(POSTS_COLLECTION).doc(id).delete();
    }
}
