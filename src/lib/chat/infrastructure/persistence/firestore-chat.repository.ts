// src/lib/chat/infrastructure/persistence/firestore-chat.repository.ts
import type { ChatMessage } from '../../domain/chat-message.entity';
import type { ChatSession } from '../../domain/chat-session.entity';
import type { ChatRepository } from '../../domain/chat.repository';
import { adminDb, adminInstance } from '@/lib/firebase/admin-config';
import type { DocumentData, QueryDocumentSnapshot, DocumentSnapshot } from 'firebase-admin/firestore';

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
  
  /**
   * Creates a new chat session and its initial message in a single atomic transaction.
   * @param sessionData - The initial data for the session.
   * @param initialMessageText - The text for the first message (usually a welcome message).
   * @returns The newly created ChatSession and the initial ChatMessage.
   */
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
    };

    const initialMessageData: any = {
      sessionId: sessionRef.id,
      text: initialMessageText,
      role: 'model' as const,
      timestamp: FieldValue.serverTimestamp(),
    };

    // Sanitize data: Ensure `businessId` is not undefined when saving.
    if (sessionData.businessId) {
        initialMessageData.businessId = sessionData.businessId;
    } else {
        delete finalSessionData.businessId; // Remove undefined property for global chats
    }

    // Run as a transaction to ensure both documents are created atomically
    await db.runTransaction(async (transaction) => {
      transaction.set(sessionRef, finalSessionData);
      transaction.set(messageRef, initialMessageData);
    });
    
    // Get the created documents to return them
    const newSessionDoc = await sessionRef.get();
    const newMessageDoc = await messageRef.get();

    return {
      session: toChatSession(newSessionDoc),
      message: toChatMessage(newMessageDoc),
    };
  }

  /**
   * Saves a message to a session's "messages" subcollection and updates
   * the parent session's metadata in a single transaction.
   * @param messageData - The message data to save.
   * @returns The saved ChatMessage entity.
   */
  async saveMessage(messageData: Omit<ChatMessage, 'id' | 'timestamp'> & { timestamp?: Date }): Promise<ChatMessage> {
    const db = this.getDb();
    const { sessionId, businessId, ...restOfMessage } = messageData as any;
    
    // Correctly build the path to the session document, whether it's global or nested.
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
        
        if (messageData.cost) {
            sessionUpdate.totalCost = FieldValue.increment(messageData.cost);
        }
        if (messageData.usage) {
            sessionUpdate.totalInputTokens = FieldValue.increment(messageData.usage.inputTokens || 0);
            sessionUpdate.totalOutputTokens = FieldValue.increment(messageData.usage.outputTokens || 0);
            sessionUpdate.totalTokens = FieldValue.increment(messageData.usage.totalTokens || 0);
        }

        // Perform the update on the correctly referenced session document.
        transaction.update(sessionRef, sessionUpdate);
    });
    
    const savedDoc = await newMessageRef.get();
    return toChatMessage(savedDoc);
  }

  /**
   * Retrieves the message history for a specific chat session.
   * @param sessionId - The ID of the session.
   * @param businessId - Optional ID of the business for context.
   * @returns An array of ChatMessage entities.
   */
  async getHistory(sessionId: string, businessId?: string): Promise<ChatMessage[]> {
    const db = this.getDb();
    const collectionPath = businessId
        ? `directory/${businessId}/businessChatSessions/${sessionId}/messages`
        : `${GLOBAL_SESSIONS_COLLECTION}/${sessionId}/messages`;

    const snapshot = await db.collection(collectionPath).orderBy('timestamp', 'asc').get();
      
    return snapshot.docs.map(toChatMessage);
  }
  
  /**
   * Finds a session by its ID.
   * @param sessionId - The ID of the session.
   * @param businessId - Optional ID of the business for context.
   * @returns The ChatSession entity or null.
   */
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
  
  /**
   * Retrieves all global chat sessions.
   * Note: This currently only gets global sessions. A more complex implementation
   * would be needed to fetch sessions from all businesses.
   * @returns An array of all ChatSession entities.
   */
  async findAllSessions(): Promise<ChatSession[]> {
    const db = this.getDb();
    const snapshot = await db.collection(GLOBAL_SESSIONS_COLLECTION).orderBy('updatedAt', 'desc').get();
    return snapshot.docs.map(toChatSession);
  }
}
