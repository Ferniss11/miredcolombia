
'use server';

import { z } from 'zod';
import { adminDb, adminInstance } from "@/lib/firebase/admin-config";
import type { ChatMessage, ChatSession, TokenUsage } from '@/lib/types';

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
  userName: z.string().min(2, "El nombre es obligatorio."),
  userPhone: z.string().min(7, "El teléfono es obligatorio."),
});

const postMessageSchema = z.object({
  businessId: z.string(),
  sessionId: z.string(),
  message: z.string(),
  history: z.array(z.any()), // Simplified for action context
});


// --- Helper Functions ---
async function findBusinessSessionByPhone(businessId: string, phone: string) {
    const db = getDbInstance();
    const sessionsRef = db.collection('directory').doc(businessId).collection('businessChatSessions');
    const querySnapshot = await sessionsRef.where('userPhone', '==', phone).orderBy('createdAt', 'desc').limit(1).get();

    if (querySnapshot.empty) return null;
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as ChatSession & { id: string };
}

async function getBusinessChatHistory(businessId: string, sessionId: string) {
    const db = getDbInstance();
    const messagesSnapshot = await db.collection('directory').doc(businessId)
      .collection('businessChatSessions').doc(sessionId)
      .collection('messages').orderBy('timestamp', 'asc').get();

    return messagesSnapshot.docs.map(doc => {
        const data = doc.data();
        return { ...data, timestamp: data.timestamp.toDate().toISOString() } as ChatMessage;
    });
}


// --- Server Actions ---

export async function startBusinessChatSessionAction(input: z.infer<typeof startSessionSchema>) {
    const db = getDbInstance();
    if (!FieldValue) throw new Error("Firebase Admin SDK is not fully initialized.");

    try {
        const { businessId, userName, userPhone } = startSessionSchema.parse(input);

        let existingSession = await findBusinessSessionByPhone(businessId, userPhone);
        if (existingSession) {
            const history = await getBusinessChatHistory(businessId, existingSession.id);
            if (history.length === 0) {
                history.push({ role: 'model', text: '¡Hola de nuevo! Soy el asistente de este negocio. ¿En qué más te puedo ayudar?', timestamp: new Date().toISOString() });
            }
            return { success: true, sessionId: existingSession.id, history };
        }

        const newSessionRef = db.collection('directory').doc(businessId).collection('businessChatSessions').doc();
        await newSessionRef.set({
            userName,
            userPhone,
            createdAt: FieldValue.serverTimestamp(),
        });

        const initialHistory = [{ role: 'model', text: '¡Hola! Soy el asistente virtual de este negocio. ¿Cómo puedo ayudarte hoy?', timestamp: new Date().toISOString() }];
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
        const { businessId, sessionId, message } = postMessageSchema.parse(input);

        const sessionRef = db.collection('directory').doc(businessId).collection('businessChatSessions').doc(sessionId);
        const messagesRef = sessionRef.collection('messages');
        
        // Save user message
        await messagesRef.add({
            text: message,
            role: 'user',
            timestamp: FieldValue.serverTimestamp(),
        });
        
        // --- AI LOGIC WILL GO HERE IN PHASE 2 ---
        // For Phase 1, we just return a canned response.
        const cannedResponse = "Gracias por tu mensaje. Un representante del negocio se pondrá en contacto contigo pronto.";
        const aiUsage: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
        // ---
        
        // Save AI (canned) response
        await messagesRef.add({
            text: cannedResponse,
            role: 'model',
            timestamp: FieldValue.serverTimestamp(),
            usage: aiUsage,
        });

        return { success: true, response: cannedResponse };

    } catch (error) {
        console.error("Error posting business message:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Error de IA: ${errorMessage}` };
    }
}
