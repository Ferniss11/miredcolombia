// src/lib/directory/infrastructure/cache/firestore-cache.adapter.ts
import { adminDb, adminInstance } from '@/lib/firebase/admin-config';
import type { Business } from '../../domain/business.entity';
import type { CacheAdapter } from './cache.adapter';
import type { DocumentData } from 'firebase-admin/firestore';

const CACHE_COLLECTION = 'directoryCache';
const CACHE_DURATION_HOURS = 720; // 30 days

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


export class FirestoreCacheAdapter implements CacheAdapter {
  private getDb() {
    if (!adminDb || !adminInstance.firestore) {
      throw new Error('Firestore is not initialized.');
    }
    return adminDb;
  }
  
  async get(id: string): Promise<Business | null> {
    const db = this.getDb();
    const docRef = db.collection(CACHE_COLLECTION).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log(`[Cache] MISS for placeId: ${id}`);
      return null;
    }

    const data = docSnap.data() as DocumentData;
    const cacheTime = data.cachedAt.toDate();
    const now = new Date();
    const hoursDiff = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > CACHE_DURATION_HOURS) {
      console.log(`[Cache] STALE for placeId: ${id}`);
      return null;
    }

    console.log(`[Cache] HIT for placeId: ${id}`);
    // Convert all timestamps in the cached data before returning
    return convertTimestamps(data) as Business;
  }

  async set(id: string, data: Partial<Business>): Promise<void> {
    const db = this.getDb();
    const docRef = db.collection(CACHE_COLLECTION).doc(id);
    
    await docRef.set({
      ...data,
      cachedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`[Cache] WROTE for placeId: ${id}`);
  }
}
