
'use server';

import { FieldValue } from "firebase-admin/firestore";
import type { ChatSession, ChatMessage } from "@/lib/types";
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
    };
}


/**
 * Finds the most recent chat session for a given phone number.
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
    
    // Serialize the timestamp before returning
    const serializedData = {
        ...data,
        id: doc.id,
        createdAt: data.createdAt.toDate().toISOString(),
    }

    return serializedData as ChatSession & { id: string };

  } catch (error) {
    console.error("Error finding session by phone:", error);
    throw new Error("Failed to find chat session by phone.");
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
    throw new Error("Failed to retrieve chat history.");
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
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating chat session in Firestore:", error);
    throw new Error('Failed to create chat session in Firestore.');
  }
}

/**
 * Saves a message to the 'messages' subcollection of a specific chat session.
 * @param sessionId - The ID of the chat session.
 * @param messageData - The message object to save.
 */
export async function saveMessage(sessionId: string, messageData: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<void> {
  try {
    const messagesCollection = chatSessionsCollection.doc(sessionId).collection('messages');
    await messagesCollection.add({
      ...messageData,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error saving message for session ${sessionId}:`, error);
    throw new Error('Failed to save message in Firestore.');
  }
}
