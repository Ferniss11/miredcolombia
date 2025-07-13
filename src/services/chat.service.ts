
'use server';

import { FieldValue } from "firebase-admin/firestore";
import type { ChatSession, ChatMessage, TokenUsage, ChatSessionWithTokens } from "@/lib/types";
import { getAdminServices } from "@/lib/firebase/admin-config";

const { db } = getAdminServices();
const chatSessionsCollection = db.collection("chatSessions");


function serializeMessage(doc: FirebaseFirestore.DocumentSnapshot): ChatMessage {
    const data = doc.data() as any;
    return {
        id: doc.id,
        text: data.text,
        role: data.role,
        timestamp: data.timestamp.toDate().toISOString(),
        usage: data.usage
    };
}

function serializeSession(doc: FirebaseFirestore.DocumentSnapshot): ChatSessionWithTokens {
    const data = doc.data()!;
    return {
        id: doc.id,
        userName: data.userName,
        userPhone: data.userPhone,
        createdAt: data.createdAt.toDate().toISOString(),
        messageCount: data.messageCount || 0, // Fallback for safety
        totalInputTokens: data.totalInputTokens || 0,
        totalOutputTokens: data.totalOutputTokens || 0,
        totalTokens: data.totalTokens || 0,
    };
}

/**
 * Finds the most recent chat session for a given phone number.
 * Firestore requires a composite index for this query. If the query fails, it's likely due to a missing index.
 * @param phone - The user's phone number.
 * @returns The chat session object if found, otherwise null.
 */
export async function findSessionByPhone(phone: string): Promise<(ChatSession & { id: string }) | null> {
  try {
    const querySnapshot = await chatSessionsCollection
      .where('userPhone', '==', phone)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data() as ChatSession;
    
    return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt.toDate().toISOString(),
    } as ChatSession & { id: string };

  } catch (error) {
    console.error("Error finding session by phone. This might be due to a missing Firestore index on (userPhone, createdAt).", error);
    if (error instanceof Error) {
        throw new Error(`Failed to find chat session by phone: ${error.message}`);
    }
    throw new Error("Failed to find chat session by phone due to an unknown server error.");
  }
}

/**
 * Retrieves the message history for a given chat session.
 * @param sessionId - The ID of the chat session.
 * @returns An array of chat messages.
 */
export async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  try {
    const messagesSnapshot = await chatSessionsCollection
      .doc(sessionId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .get();
      
    if (messagesSnapshot.empty) {
        return [];
    }
      
    return messagesSnapshot.docs.map(serializeMessage);
  } catch (error) {
    console.error(`Error getting chat history for session ${sessionId}:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to retrieve chat history: ${error.message}`);
    }
    throw new Error("Failed to retrieve chat history due to an unknown server error.");
  }
}

/**
 * Creates a new chat session document in Firestore.
 * @param sessionData - The initial data for the chat session (user's name and phone).
 * @returns The ID of the newly created chat session.
 */
export async function startChatSession(sessionData: Omit<ChatSession, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await chatSessionsCollection.add({
      ...sessionData,
      createdAt: FieldValue.serverTimestamp(),
      totalTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating chat session in Firestore:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to create chat session in Firestore: ${error.message}`);
    }
    throw new Error('Failed to create chat session in Firestore due to an unknown server error.');
  }
}

/**
 * Saves a message to the 'messages' subcollection and updates token counts on the parent session.
 * @param sessionId - The ID of the chat session.
 * @param messageData - The message object to save.
 * @param usage - Optional token usage data from the AI call.
 */
export async function saveMessage(sessionId: string, messageData: Omit<ChatMessage, 'id' | 'timestamp'>, usage?: TokenUsage): Promise<void> {
  try {
    const sessionRef = chatSessionsCollection.doc(sessionId);
    const messagesCollection = sessionRef.collection('messages');
    
    // Use a transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
        // 1. Add the new message
        const newMessageRef = messagesCollection.doc();
        transaction.set(newMessageRef, {
            ...messageData,
            timestamp: FieldValue.serverTimestamp(),
            usage, // Store token usage with the AI's response message
        });

        // 2. Update the aggregate counts on the session document
        const sessionUpdate: { [key: string]: any } = {
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (usage) {
            sessionUpdate.totalInputTokens = FieldValue.increment(usage.inputTokens);
            sessionUpdate.totalOutputTokens = FieldValue.increment(usage.outputTokens);
            sessionUpdate.totalTokens = FieldValue.increment(usage.totalTokens);
        }
        
        transaction.update(sessionRef, sessionUpdate);
    });

  } catch (error) {
    console.error(`Error saving message for session ${sessionId}:`, error);
     if (error instanceof Error) {
        throw new Error(`Failed to save message in Firestore: ${error.message}`);
    }
    throw new Error('Failed to save message in Firestore due to an unknown server error.');
  }
}

/**
 * Retrieves all chat sessions with their aggregated token data.
 */
export async function getAllChatSessions(): Promise<ChatSessionWithTokens[]> {
    const snapshot = await chatSessionsCollection.orderBy('createdAt', 'desc').get();
    if (snapshot.empty) {
        return [];
    }
    
    const sessionsWithCounts = await Promise.all(snapshot.docs.map(async (doc) => {
        const sessionData = serializeSession(doc);
        const messagesSnapshot = await doc.ref.collection('messages').get();
        sessionData.messageCount = messagesSnapshot.size;
        return sessionData;
    }));

    return sessionsWithCounts;
}

/**
 * Retrieves a single chat session by its ID.
 */
export async function getChatSessionById(sessionId: string): Promise<ChatSessionWithTokens | null> {
  const docRef = chatSessionsCollection.doc(sessionId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return null;
  }
  
  const session = serializeSession(docSnap);
  const messagesSnapshot = await docRef.collection('messages').get();
  session.messageCount = messagesSnapshot.size;

  return session;
}
