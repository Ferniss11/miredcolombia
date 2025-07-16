
'use server';

import { z } from 'zod';
import { adminDb, adminInstance } from "@/lib/firebase/admin-config";
import type { ChatMessage, ChatSession, TokenUsage } from '@/lib/types';
import { getAgentConfig } from '@/services/agent.service';
import { chat } from '@/ai/flows/chat-flow'; // Re-use the simple chat flow for now

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
            return { success: true, sessionId: existingSession.id, history };
        }

        const newSessionRef = db.collection('directory').doc(businessId).collection('businessChatSessions').doc();
        await newSessionRef.set({
            userName,
            userPhone,
            createdAt: FieldValue.serverTimestamp(),
        });
        
        // No initial message here, it will be added in the ChatWidget based on context.
        return { success: true, sessionId: newSessionRef.id, history: [] };

    } catch (error) {
        console.error("Error starting business chat session:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `No se pudo iniciar el chat: ${errorMessage}` };
    }
}


const formatHistoryAsPrompt = (history: Omit<ChatMessage, 'id' | 'usage'>[]): string => {
    return history.map(msg => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.text}`).join('\n');
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
        
        // --- AI LOGIC (Phase 2 placeholder, re-using main agent logic) ---
        const history = await getBusinessChatHistory(businessId, sessionId);
        const fullPrompt = `${formatHistoryAsPrompt(history)}\nUsuario: ${message}`;
        
        // NOTE: In a real Phase 2, this would be a specialized business agent config.
        // For now, we re-use the main agent's config.
        const agentConfig = await getAgentConfig();

        const aiResponse = await chat({
            model: agentConfig.model,
            systemPrompt: agentConfig.systemPrompt, // This will be specialized later
            prompt: fullPrompt,
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
