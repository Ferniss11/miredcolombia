
// src/lib/email-sequence/infrastructure/persistence/firestore-email-sequence.repository.ts
import type { EmailSequence } from '../../domain/email-sequence.entity';
import type { EmailSequenceRepository } from '../../domain/email-sequence.repository';
import { adminDb } from '@/lib/firebase/admin-config';
import type { DocumentData, DocumentSnapshot } from 'firebase-admin/firestore';

const SEQUENCES_COLLECTION = 'emailSequences';

const toEmailSequence = (doc: DocumentSnapshot): EmailSequence => {
    const data = doc.data() as DocumentData;
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
    } as EmailSequence;
}

export class FirestoreEmailSequenceRepository implements EmailSequenceRepository {
    private getDb() {
        if (!adminDb) throw new Error('Firestore not initialized');
        return adminDb;
    }

    async create(sequenceData: Omit<EmailSequence, 'id'>): Promise<EmailSequence> {
        const db = this.getDb();
        const docRef = await db.collection(SEQUENCES_COLLECTION).add(sequenceData);
        const newDoc = await docRef.get();
        return toEmailSequence(newDoc);
    }
    
    async findById(id: string): Promise<EmailSequence | null> {
        const db = this.getDb();
        const doc = await db.collection(SEQUENCES_COLLECTION).doc(id).get();
        return doc.exists ? toEmailSequence(doc) : null;
    }
    
    async findActiveByTrigger(trigger: EmailSequence['trigger']): Promise<EmailSequence | null> {
        const db = this.getDb();
        const snapshot = await db.collection(SEQUENCES_COLLECTION)
            .where('trigger', '==', trigger)
            .where('isActive', '==', true)
            .limit(1)
            .get();
        
        return snapshot.empty ? null : toEmailSequence(snapshot.docs[0]);
    }
    
    async findAll(): Promise<EmailSequence[]> {
        const db = this.getDb();
        const snapshot = await db.collection(SEQUENCES_COLLECTION).orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => toEmailSequence(doc));
    }

    async update(id: string, data: Partial<EmailSequence>): Promise<EmailSequence> {
        const db = this.getDb();
        const docRef = db.collection(SEQUENCES_COLLECTION).doc(id);
        await docRef.update({ ...data, updatedAt: new Date() });
        const updatedDoc = await docRef.get();
        return toEmailSequence(updatedDoc);
    }

    async delete(id: string): Promise<void> {
        const db = this.getDb();
        await db.collection(SEQUENCES_COLLECTION).doc(id).delete();
    }
}
