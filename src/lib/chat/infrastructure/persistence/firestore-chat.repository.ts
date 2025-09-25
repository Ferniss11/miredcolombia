// src/lib/chat/infrastructure/persistence/firestore-chat.repository.ts
import type { ChatMessage } from '../../domain/chat-message.entity';
import type { ChatSession } from '../../domain/chat-session.entity';
import type { ChatRepository } from '../../domain/chat.repository';
import { adminDb, adminInstance } from '@/lib/firebase/admin-config';
import type { DocumentData, QueryDocumentSnapshot, DocumentSnapshot, CollectionReference } from 'firebase-admin/firestore';
import { AgentConfig } from '@/lib/chat-types';

const FieldValue = adminInstance?.firestore.FieldValue;
const GLOBAL_SESSIONS_COLLECTION = 'chatSessions';

/**
 * Converts Firestore document data into a ChatSession entity, handling Timestamps.
 * @param doc - The Firestore document snapshot.
 * @returns A ChatSession entity.
 */
function toChatSession(doc: DocumentSnapshot<DocumentData>): ChatSession {
  const data = doc.data();
  if (!data) throw new Error("Document data is undefined.");
  return {
    id: doc.id,
    ...data,
    messageCount: data.messageCount || 0, // Ensure messageCount defaults to 0
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  } as ChatSession;
}

/**
 * Converts Firestore document data into a ChatMessage entity, handling Timestamps.
 * @param doc - The Firestore document snapshot.
 * @returns A ChatMessage entity.
 */
function toChatMessage(doc: DocumentSnapshot<DocumentData>): ChatMessage {
    const data = doc.data();
    if (!data) throw new Error("Document data is undefined.");
    return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp.toDate(),
    } as ChatMessage;
}


/**
 * A Firestore-backed implementation of the ChatRepository port.
 * This adapter handles all direct communication with the Firestore database
 * for chat-related data.
 */
export class FirestoreChatRepository implements ChatRepository {
  private getDb() {
    if (!adminDb || !FieldValue) {
      throw new Error('Firestore is not initialized.');
    }
    return adminDb;
  }
  
  async createSessionWithInitialMessage(
    sessionData: Omit<ChatSession, 'id'>,
    initialMessageText: string
  ): Promise<{ session: ChatSession; message: ChatMessage }> {
    const db = this.getDb();
    const collectionPath = sessionData.businessId
      ? `directory/${sessionData.businessId}/businessChatSessions`
      : GLOBAL_SESSIONS_COLLECTION;

    const sessionRef = db.collection(collectionPath).doc();
    const messageRef = sessionRef.collection('messages').doc();

    const finalSessionData: any = {
      ...sessionData,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      messageCount: 0,
    };

    const initialMessageData: any = {
      sessionId: sessionRef.id,
      text: initialMessageText,
      role: 'model' as const,
      timestamp: FieldValue.serverTimestamp(),
      authorName: 'Valeria',
    };

    // Explicitly set businessId if it exists, otherwise don't include it.
    if (sessionData.businessId) {
        initialMessageData.businessId = sessionData.businessId;
    } else {
        delete finalSessionData.businessId; // Ensure it's not present for global chats
    }

    await db.runTransaction(async (transaction) => {
      transaction.set(sessionRef, finalSessionData);
      transaction.set(messageRef, initialMessageData);
    });
    
    const newSessionDoc = await sessionRef.get();
    const newMessageDoc = await messageRef.get();

    return {
      session: toChatSession(newSessionDoc),
      message: toChatMessage(newMessageDoc),
    };
  }

  async saveMessage(messageData: Omit<ChatMessage, 'id' | 'timestamp'> & { timestamp?: Date, agentConfig?: AgentConfig }): Promise<ChatMessage> {
    const db = this.getDb();
    const { sessionId, businessId, agentConfig, ...restOfMessage } = messageData as any;
    
    const sessionDocPath = businessId
        ? `directory/${businessId}/businessChatSessions/${sessionId}`
        : `${GLOBAL_SESSIONS_COLLECTION}/${sessionId}`;
        
    const sessionRef = db.doc(sessionDocPath);
    const messagesRef = sessionRef.collection('messages');
    
    const newMessageRef = messagesRef.doc();

    await db.runTransaction(async (transaction) => {
        const finalMessageData: any = {
            ...restOfMessage,
            sessionId: sessionId,
            timestamp: FieldValue.serverTimestamp(),
        };
        if (businessId) {
          finalMessageData.businessId = businessId;
        }
        transaction.set(newMessageRef, finalMessageData);

        const sessionUpdate: { [key: string]: any } = {
            updatedAt: FieldValue.serverTimestamp(),
        };
        
        if (messageData.role === 'user') {
            sessionUpdate.messageCount = FieldValue.increment(1);
        }
        
        if (messageData.cost) {
            sessionUpdate.totalCost = FieldValue.increment(messageData.cost);
        }
        if (messageData.usage) {
            sessionUpdate.totalInputTokens = FieldValue.increment(messageData.usage.inputTokens || 0);
            sessionUpdate.totalOutputTokens = FieldValue.increment(messageData.usage.outputTokens || 0);
            sessionUpdate.totalTokens = FieldValue.increment(messageData.usage.totalTokens || 0);
        }

        if (agentConfig) {
            sessionUpdate.agentConfig = agentConfig;
        }

        transaction.update(sessionRef, sessionUpdate);
    });
    
    const savedDoc = await newMessageRef.get();
    return toChatMessage(savedDoc);
  }

  async getHistory(sessionId: string, businessId?: string): Promise<ChatMessage[]> {
    const db = this.getDb();
    const collectionPath = businessId
        ? `directory/${businessId}/businessChatSessions/${sessionId}/messages`
        : `${GLOBAL_SESSIONS_COLLECTION}/${sessionId}/messages`;

    const snapshot = await db.collection(collectionPath).orderBy('timestamp', 'asc').get();
      
    return snapshot.docs.map(toChatMessage);
  }
  
  async findSessionById(sessionId: string, businessId?: string): Promise<ChatSession | null> {
    const db = this.getDb();
     const collectionPath = businessId
        ? `directory/${businessId}/businessChatSessions`
        : GLOBAL_SESSIONS_COLLECTION;
    
    const doc = await db.collection(collectionPath).doc(sessionId).get();
    if (!doc.exists) {
      return null;
    }
    return toChatSession(doc);
  }

  async findSessionByPhone(phone: string, businessId?: string): Promise<ChatSession | null> {
    const db = this.getDb();
    const collectionPath = businessId
        ? `directory/${businessId}/businessChatSessions`
        : GLOBAL_SESSIONS_COLLECTION;

    const snapshot = await db.collection(collectionPath)
        .where('userPhone', '==', phone)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
        
    if (snapshot.empty) {
        return null;
    }
    return toChatSession(snapshot.docs[0]);
  }
  
  async findAllSessions(filters?: { userId?: string, isLabSession?: boolean }): Promise<ChatSession[]> {
    const db = this.getDb();
    let query: FirebaseFirestore.Query<DocumentData> = db.collection(GLOBAL_SESSIONS_COLLECTION);
    
    if (filters?.userId) {
        query = query.where('userId', '==', filters.userId);
    }
    // Corrected: Add the filter for lab sessions
    if (filters?.isLabSession) {
        query = query.where('isLabSession', '==', true);
    }
    
    const snapshot = await query.orderBy('updatedAt', 'desc').get();
    return snapshot.docs.map(toChatSession);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const db = this.getDb();
    const sessionRef = db.collection(GLOBAL_SESSIONS_COLLECTION).doc(sessionId);

    // Delete subcollection recursively
    const messagesSnapshot = await sessionRef.collection('messages').get();
    if (!messagesSnapshot.empty) {
        const batch = db.batch();
        messagesSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }

    // Delete the main session document
    await sessionRef.delete();
  }
}
