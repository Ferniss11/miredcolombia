
import { FieldValue } from "firebase-admin/firestore";
import type { ChatSession, ChatMessage } from "@/lib/types";
import { getAdminServices } from "@/lib/firebase/admin-config";

const { db } = getAdminServices();
const chatSessionsCollection = db.collection("chatSessions");

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
