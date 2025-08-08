

'use server';

import { adminDb, adminInstance } from "@/lib/firebase/admin-config";
import { ChatSession, ChatMessage, TokenUsage, ChatSessionWithTokens } from "@/lib/chat-types";
import { calculateCost } from "@/lib/ai-costs";
import { getAgentConfig } from "./agent.service";
import type { UserProfile } from "@/lib/types";

const FieldValue = adminInstance?.firestore.FieldValue;


function getDbInstance() {
    if (!adminDb) {
        // This will now correctly use the null-checked instance from admin-config
        throw new Error("Firebase Admin SDK is not initialized. Chat service is unavailable.");
    }
    return adminDb;
}

function serializeMessage(doc: FirebaseFirestore.DocumentSnapshot): ChatMessage {
    const data = doc.data() as any;
    // This logic correctly interprets legacy and new messages
    let role = data.role;
    if (role === 'model' && data.authorName) {
        role = 'admin';
    }

    return {
        id: doc.id,
        text: data.text,
        role: role,
        timestamp: data.timestamp.toDate().toISOString(),
        usage: data.usage,
        cost: data.cost,
        authorName: data.authorName,
        replyTo: data.replyTo || null,
    };
}

function serializeSession(doc: FirebaseFirestore.DocumentSnapshot): ChatSessionWithTokens {
    const data = doc.data()!;
    return {
        id: doc.id,
        userName: data.userName,
        userPhone: data.userPhone,
        userEmail: data.userEmail,
        createdAt: data.createdAt.toDate().toISOString(),
        messageCount: data.messageCount || 0, // Fallback for safety
        totalInputTokens: data.totalInputTokens || 0,
        totalOutputTokens: data.totalOutputTokens || 0,
        totalTokens: data.totalTokens || 0,
        totalCost: data.totalCost || 0,
    };
}

/**
 * Finds the most recent chat session for a given phone number.
 * This query no longer requires a composite index.
 * @param phone - The user's phone number.
 * @returns The chat session object if found, otherwise null.
 */
export async function findSessionByPhone(phone: string): Promise<(ChatSession & { id: string }) | null> {
  const db = getDbInstance();
  try {
    const querySnapshot = await db.collection("chatSessions")
      .where('userPhone', '==', phone)
      .get();

    if (querySnapshot.empty) {
      return null;
    }
    
    // Sort by creation date in the server to find the most recent one
    const sessions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })).sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    
    const latestSession = sessions[0];
    
    return {
        ...latestSession,
        createdAt: latestSession.createdAt.toDate().toISOString(),
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
  const db = getDbInstance();
  try {
    const messagesSnapshot = await db.collection("chatSessions")
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
  const db = getDbInstance();
  if (!FieldValue) throw new Error("Firebase Admin SDK is not fully initialized.");
  try {
    const docRef = await db.collection("chatSessions").add({
      ...sessionData,
      createdAt: FieldValue.serverTimestamp(),
      totalTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
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
  const db = getDbInstance();
  if (!FieldValue) throw new Error("Firebase Admin SDK is not fully initialized.");
  try {
    const sessionRef = db.collection("chatSessions").doc(sessionId);
    const messagesCollection = sessionRef.collection('messages');
    
    await db.runTransaction(async (transaction) => {
        const newMessageRef = messagesCollection.doc();
        const agentConfig = await getAgentConfig();

        // Build the message object dynamically to avoid undefined fields
        const finalMessageObject: any = {
            ...messageData,
            timestamp: FieldValue.serverTimestamp(),
        };

        let cost = 0;
        if (usage) {
            finalMessageObject.usage = usage;
            cost = calculateCost(agentConfig.model, usage.inputTokens, usage.outputTokens);
            finalMessageObject.cost = cost;
        }

        // 1. Add the new message
        transaction.set(newMessageRef, finalMessageObject);

        // 2. Update the aggregate counts on the session document
        const sessionUpdate: { [key: string]: any } = {
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (usage) {
            sessionUpdate.totalInputTokens = FieldValue.increment(usage.inputTokens);
            sessionUpdate.totalOutputTokens = FieldValue.increment(usage.outputTokens);
            sessionUpdate.totalTokens = FieldValue.increment(usage.totalTokens);
            sessionUpdate.totalCost = FieldValue.increment(cost);
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

export async function saveAdminMessage(
  sessionId: string,
  text: string,
  authorName: string,
  replyTo: ChatMessage['replyTo']
): Promise<ChatMessage> {
    const db = getDbInstance();
    if (!FieldValue) throw new Error("Firebase Admin SDK is not fully initialized.");
    try {
        const messageData: Partial<ChatMessage> = {
            text,
            role: 'admin',
            authorName,
            timestamp: FieldValue.serverTimestamp() as any,
            replyTo: replyTo || null,
        };
        const messageRef = await db.collection("chatSessions").doc(sessionId).collection("messages").add(messageData);
        
        return {
            id: messageRef.id,
            text,
            role: 'admin',
            authorName,
            timestamp: new Date().toISOString(),
            replyTo: replyTo || null,
        };
    } catch (error) {
         console.error(`Error saving admin message for session ${sessionId}:`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to save admin message in Firestore: ${error.message}`);
        }
        throw new Error('Failed to save admin message in Firestore due to an unknown server error.');
    }
}


/**
 * Retrieves all chat sessions with their aggregated token data.
 */
export async function getAllChatSessions(): Promise<ChatSessionWithTokens[]> {
    const db = getDbInstance();
    const snapshot = await db.collection("chatSessions").orderBy('createdAt', 'desc').get();
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
 * Retrieves a single chat session by its ID, enriching it with the user's email if possible.
 */
export async function getChatSessionById(sessionId: string): Promise<ChatSessionWithTokens | null> {
  const db = getDbInstance();
  const docRef = db.collection("chatSessions").doc(sessionId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return null;
  }
  
  const session = serializeSession(docSnap);

  // Enrich with email by finding a user with a matching phone number
  const usersRef = db.collection('users');
  const userQuery = usersRef.where('businessProfile.phone', '==', session.userPhone).limit(1);
  const userSnapshot = await userQuery.get();
  
  if (!userSnapshot.empty) {
    const userProfile = userSnapshot.docs[0].data() as UserProfile;
    session.userEmail = userProfile.email || 'No registrado';
  } else {
    // Check if the user exists but phone is in a different field
     const userQueryByMainPhone = usersRef.where('phone', '==', session.userPhone).limit(1);
     const userSnapshotByMain = await userQueryByMainPhone.get();
      if (!userSnapshotByMain.empty) {
        const userProfile = userSnapshotByMain.docs[0].data() as UserProfile;
        session.userEmail = userProfile.email || 'No registrado';
      }
  }


  const messagesSnapshot = await docRef.collection('messages').get();
  session.messageCount = messagesSnapshot.size;

  return session;
}


export async function getBusinessChatSessions(businessId: string): Promise<any[]> {
    const db = getDbInstance();
    const sessionsRef = db.collection('directory').doc(businessId).collection('businessChatSessions');
    const snapshot = await sessionsRef.get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
