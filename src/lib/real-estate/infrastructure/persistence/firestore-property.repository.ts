// src/lib/real-estate/infrastructure/persistence/firestore-property.repository.ts
import type { Property } from '../../domain/property.entity';
import type { PropertyRepository } from '../../domain/property.repository';
import { adminDb, adminInstance } from '@/lib/firebase/admin-config';
import type { DocumentData, QueryDocumentSnapshot, DocumentSnapshot } from 'firebase-admin/firestore';

const PROPERTIES_COLLECTION = 'properties';

// Helper to convert Firestore Timestamps to JS Dates in a nested object
const toProperty = (doc: DocumentSnapshot): Property => {
    const data = doc.data() as DocumentData;
    const convertTimestamps = (data: any): any => {
        if (!data) return data;
        const newData: { [key: string]: any } = {};
        for (const key in data) {
            const value = data[key];
            if (value && typeof value.toDate === 'function') {
                newData[key] = value.toDate();
            } else if (value && typeof value === 'object' && !Array.isArray(value) && value !== null) {
                newData[key] = convertTimestamps(value);
            } else {
                newData[key] = value;
            }
        }
        return newData;
    };
    const convertedData = convertTimestamps(data);
    return {
        id: doc.id,
        ...convertedData,
    } as Property;
};


export class FirestorePropertyRepository implements PropertyRepository {
    private getDb() {
        if (!adminDb) throw new Error('Firestore not initialized');
        return adminDb;
    }

    async create(propertyData: Omit<Property, 'id'>): Promise<Property> {
        const db = this.getDb();
        const docRef = db.collection(PROPERTIES_COLLECTION).doc();
        const newProperty = {
            ...propertyData,
            id: docRef.id,
        };
        await docRef.set(newProperty);
        return newProperty;
    }

    async findById(id: string): Promise<Property | null> {
        const db = this.getDb();
        const doc = await db.collection(PROPERTIES_COLLECTION).doc(id).get();
        if (!doc.exists) {
            return null;
        }
        return toProperty(doc);
    }
    
    async findAll(status?: Property['status']): Promise<Property[]> {
        const db = this.getDb();
        let query: FirebaseFirestore.Query = db.collection(PROPERTIES_COLLECTION);
        
        if (status) {
            query = query.where('status', '==', status);
        }
        
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => toProperty(doc));
    }

    async update(id: string, data: Partial<Omit<Property, 'id' | 'createdAt'>>): Promise<Property> {
        const db = this.getDb();
        const docRef = db.collection(PROPERTIES_COLLECTION).doc(id);
        
        await docRef.update({
            ...data,
            updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
        });
        
        const updatedDoc = await docRef.get();
        if (!updatedDoc.exists) {
            throw new Error('Failed to retrieve property after update.');
        }
        return toProperty(updatedDoc);
    }
    
    async delete(id: string): Promise<void> {
        const db = this.getDb();
        await db.collection(PROPERTIES_COLLECTION).doc(id).delete();
    }
}
