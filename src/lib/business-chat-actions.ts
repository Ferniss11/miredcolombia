
'use server';

import { z } from 'zod';
import { adminDb, adminInstance } from "@/lib/firebase/admin-config";
import type { ChatMessage, ChatSession, TokenUsage } from '@/lib/types';
import { businessChat } from '@/ai/businessAgent/flows/business-chat-flow';

const FieldValue = adminInstance?.firestore.FieldValue;

function getDbInstance() {
    if (!adminDb) {
        throw new Error("Firebase Admin SDK is not initialized. Chat service is unavailable.");
    }
    return adminDb;
}

// --- Schemas for validation ---
const startSessionSchema = z.object({
  businessId: z.string(),
  businessName: z.string(),
  userName: z.string().min(2, "El nombre es obligatorio."),
  userPhone: z.string().min(7, "El teléfono es obligatorio."),
});

const postMessageSchema = z.object({
  businessId: z.string(),
  sessionId: z.string(),
  message: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'model', 'admin']),
    text: z.string(),
  })),
});


// --- Helper Functions ---
async function findBusinessSessionByPhone(businessId: string, phone: string) {
    const db = getDbInstance();
    const sessionsRef = db.collection('directory').doc(businessId).collection('businessChatSessions');
    const querySnapshot = await sessionsRef.where('userPhone', '==', phone).get();

    if (querySnapshot.empty) return null;
    
    // Sort on the server to find the most recent
    const sessions = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    return sessions[0] as ChatSession & { id: string };
}

async function getBusinessChatHistory(businessId: string, sessionId: string) {
    const db = getDbInstance();
    const messagesSnapshot = await db.collection('directory').doc(businessId)
      .collection('businessChatSessions').doc(sessionId)
      .collection('messages').orderBy('timestamp', 'asc').get();

    return messagesSnapshot.docs.map(doc => {
        const data = doc.data();
        let role = data.role;
        // This is the key fix: correctly identify admin messages when reading history.
        if (data.role === 'model' && data.authorName) {
            role = 'admin';
        }
        return {
          role: role,
          text: data.text,
          timestamp: data.timestamp.toDate().toISOString(),
        }
    });
}


// --- Server Actions ---

export async function startBusinessChatSessionAction(input: z.infer<typeof startSessionSchema>) {
    const db = getDbInstance();
    if (!FieldValue) throw new Error("Firebase Admin SDK is not fully initialized.");

    try {
        const { businessId, businessName, userName, userPhone } = startSessionSchema.parse(input);

        let existingSession = await findBusinessSessionByPhone(businessId, userPhone);
        if (existingSession) {
            const history = await getBusinessChatHistory(businessId, existingSession.id);
            return { success: true, sessionId: existingSession.id, history };
        }

        const newSessionRef = db.collection('directory').doc(businessId).collection('businessChatSessions').doc();
        await newSessionRef.set({
            userName,
            userPhone,
            createdAt: FieldValue.serverTimestamp(),
        });
        
        const welcomeText = `¡Hola! Soy el asistente virtual de ${businessName}. ¿Cómo puedo ayudarte hoy?`;
        const initialHistory = [{ role: 'model' as const, text: welcomeText, timestamp: new Date().toISOString() }];

        // Add the initial welcome message to the new session
        await newSessionRef.collection('messages').add({
            text: welcomeText,
            role: 'model',
            timestamp: FieldValue.serverTimestamp(),
        });

        return { success: true, sessionId: newSessionRef.id, history: initialHistory };

    } catch (error) {
        console.error("Error starting business chat session:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `No se pudo iniciar el chat: ${errorMessage}` };
    }
}


export async function postBusinessMessageAction(input: z.infer<typeof postMessageSchema>) {
    const db = getDbInstance();
    if (!FieldValue) throw new Error("Firebase Admin SDK is not fully initialized.");
    
    try {
        const { businessId, sessionId, message, history } = postMessageSchema.parse(input);

        const sessionRef = db.collection('directory').doc(businessId).collection('businessChatSessions').doc(sessionId);
        const messagesRef = sessionRef.collection('messages');
        
        // Save user message
        await messagesRef.add({
            text: message,
            role: 'user',
            timestamp: FieldValue.serverTimestamp(),
        });
        
        // --- NEW: Call the specialized business agent ---
        const aiResponse = await businessChat({
            businessId,
            chatHistory: history,
            currentMessage: message
        });

        if (aiResponse && aiResponse.response) {
            await messagesRef.add({
                text: aiResponse.response,
                role: 'model',
                timestamp: FieldValue.serverTimestamp(),
                usage: aiResponse.usage,
            });
            return { success: true, response: aiResponse.response };
        } else {
             throw new Error("La respuesta de la IA fue nula o inválida.");
        }
        // --- End AI Logic ---

    } catch (error) {
        console.error("Error posting business message:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Error de IA: ${errorMessage}` };
    }
}
