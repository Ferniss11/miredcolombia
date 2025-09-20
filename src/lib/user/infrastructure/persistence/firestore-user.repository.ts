// infrastructure/persistence/firestore-user.repository.ts
import type { User } from '../../domain/user.entity';
import type { UserRepository } from '../../domain/user.repository';
import { adminDb, adminInstance } from '@/lib/firebase/admin-config';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import type { AgentConfig } from '@/lib/chat-types';

const USERS_COLLECTION = 'users';

const convertTimestamps = (data: DocumentData): any => {
    const newData: { [key: string]: any } = {};
    for (const key in data) {
        const value = data[key];
        if (value && typeof value.toDate === 'function') {
            newData[key] = value.toDate();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            newData[key] = convertTimestamps(value); // Recursively convert nested objects
        } else {
            newData[key] = value;
        }
    }
    return newData;
}


export class FirestoreUserRepository implements UserRepository {
  private toUser(doc: QueryDocumentSnapshot | DocumentData): User {
    const data = doc.data();
    if (!data) {
        throw new Error("Document data is undefined.");
    }
    const convertedData = convertTimestamps(data);
    return {
      uid: doc.id,
      ...convertedData,
    } as User;
  }

  async create(user: User): Promise<User> {
    if (!adminDb) throw new Error('Firestore not initialized');
    await adminDb.collection(USERS_COLLECTION).doc(user.uid).set(user);
    return user;
  }

  async findByUid(uid: string): Promise<User | null> {
    if (!adminDb) throw new Error('Firestore not initialized');
    const doc = await adminDb.collection(USERS_COLLECTION).doc(uid).get();
    if (!doc.exists) {
      return null;
    }
    return this.toUser(doc as QueryDocumentSnapshot);
  }

  async findUserByBusinessId(businessId: string): Promise<User | null> {
      if (!adminDb) throw new Error('Firestore not initialized');
      const snapshot = await adminDb.collection(USERS_COLLECTION)
          .where('businessProfile.placeId', '==', businessId)
          .limit(1)
          .get();
      if (snapshot.empty) {
          return null;
      }
      return this.toUser(snapshot.docs[0]);
  }

  async findAll(): Promise<User[]> {
    if (!adminDb) throw new Error('Firestore not initialized');
    const snapshot = await adminDb.collection(USERS_COLLECTION).orderBy('createdAt', 'desc').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => this.toUser(doc as QueryDocumentSnapshot));
  }

  async update(uid: string, data: Partial<User>): Promise<User> {
    if (!adminDb) throw new Error('Firestore not initialized');
    const userRef = adminDb.collection(USERS_COLLECTION).doc(uid);
    await userRef.update({ ...data, updatedAt: new Date() });
    const updatedDoc = await userRef.get();
    return this.toUser(updatedDoc as QueryDocumentSnapshot);
  }

  async softDelete(uid: string): Promise<void> {
    if (!adminDb) throw new Error('Firestore not initialized');
    const userRef = adminDb.collection(USERS_COLLECTION).doc(uid);
    await userRef.update({ status: 'deleted', updatedAt: new Date() });
  }

  async findPublicProfileByUid(uid: string): Promise<Partial<User> | null> {
    const user = await this.findByUid(uid);
    if (!user) {
      return null;
    }
    // Return only a subset of fields safe for public exposure
    return {
      uid: user.uid,
      name: user.name,
      role: user.role,
      businessProfile: user.businessProfile, // Assuming this is public
      candidateProfile: user.candidateProfile ? { professionalTitle: user.candidateProfile.professionalTitle } : undefined,
    };
  }

  // Agent Specific Methods
  async getAgentConfig(agentId: string = 'global'): Promise<AgentConfig> {
    if (!adminDb) throw new Error('Firestore not initialized');
    const docRef = adminDb.collection('agentConfig').doc(agentId);
    console.log(`[FirestoreRepo] Fetching agent config from: ${docRef.path}`);
    const doc = await docRef.get();
    
    if (!doc.exists) {
        console.warn(`[FirestoreRepo] No agent config found for '${agentId}'. Returning default.`);
        return {
            model: 'googleai/gemini-1.5-flash-latest',
            systemPrompt: 'Eres un asistente de IA para Mi Red Colombia. Ayuda a los usuarios con sus preguntas sobre inmigración y servicios.'
        };
    }
    return doc.data() as AgentConfig;
  }

  async saveAgentConfig(agentId: string, config: AgentConfig): Promise<void> {
    if (!adminDb) throw new Error('Firestore not initialized');
    await adminDb.collection('agentConfig').doc(agentId).set(config, { merge: true });
  }
}
