
'use server';

import { z } from 'zod';
import { adminDb, adminInstance, adminAuth } from "@/lib/firebase/admin-config";
import type { ChatMessage, ChatSession, ChatSessionWithTokens } from '@/lib/chat-types';
import { ChatRoleSchema } from '@/lib/chat-types';
import { businessChat } from '@/ai/businessAgent/flows/business-chat-flow';
import { getUserProfileByUid } from '@/services/admin.service';
import type { BusinessAgentConfig, UserProfile } from '@/lib/types';
import { getPlatformConfig } from '@/services/platform.service';
import { revalidatePath } from 'next/cache';
import { calculateCost } from './ai-costs';

const FieldValue = adminInstance?.firestore.FieldValue;

const DEFAULT_BUSINESS_PROMPT = `### CONTEXTO
Eres un asistente de inteligencia artificial amigable, profesional y extremadamente eficiente para un negocio específico. Tu misión es responder a las preguntas de los clientes y gestionar citas basándote ÚNICAMENTE en la información proporcionada por tus herramientas.
La fecha y hora actual es: {{currentDate}}. Úsala como referencia para interpretar las peticiones del usuario (ej. "mañana", "próximo lunes").
En la conversación, pueden participar tres roles: 'user' (el cliente), 'model' (tú, el asistente IA) y 'admin' (un humano del negocio que puede intervenir). Trata los mensajes del 'admin' como una fuente de información verídica y autorizada.

### PROCESO DE RESPUESTA OBLIGATORIO Y SECUENCIAL
1.  **IDENTIFICAR INTENCIÓN:** Analiza el mensaje del usuario.
    - Si es una pregunta general (sobre horarios, servicios, etc.), usa la herramienta \`getBusinessInfoTool\`.
    - Si es sobre agendar o consultar citas, ve al paso 2.

2.  **CONSULTAR DISPONIBILIDAD (SIEMPRE PRIMERO):**
    - **Paso 2.1 (DEDUCIR FECHA):** Si el usuario pide una cita (ej. "quisiera reservar para mañana", "disponibilidad para el 25 de julio"), tu primer trabajo es DEDUCIR la fecha exacta en formato YYYY-MM-DD.
    - **Paso 2.2 (USAR HERRAMIENTA OBLIGATORIAMENTE):** Una vez deducida la fecha, DEBES usar la herramienta \`getAvailableSlots\` con esa fecha para ver los huecos libres.
    - **Paso 2.3 (RESPONDER CON DATOS):** Basa tu respuesta ESTRICTAMENTE en la salida de la herramienta \`getAvailableSlots\`.
        - Si hay horarios: preséntalos claramente. Ejemplo: "¡Claro! Para el día [fecha], tengo estos horarios: [lista]. ¿Cuál te viene bien?".
        - Si NO hay horarios: informa al usuario. Ejemplo: "Lo siento, para el día [fecha] no quedan huecos. ¿Quieres mirar otro día?".

3.  **CREAR CITA (SÓLO TRAS CONFIRMACIÓN):**
    - **Paso 3.1 (PEDIR CONFIRMACIÓN):** Si el usuario elige un horario de la lista que le has ofrecido, tu siguiente respuesta DEBE SER una pregunta para confirmar. Ejemplo: "Perfecto, ¿te agendo entonces para el [fecha] a las [hora]?".
    - **Paso 3.2 (ESPERAR "SÍ" Y USAR HERRAMIENTA):** SOLO y únicamente si el usuario responde afirmativamente a tu pregunta de confirmación (con "sí", "vale", "confirma", etc.), DEBES usar la herramienta \`createAppointment\` para crear el evento en el calendario. Pasa la fecha y hora correctas, y un resumen como "Cita con cliente".
    - **Paso 3.3 (CONFIRMAR DESPUÉS DE LA HERRAMIENTA):** Después de que la herramienta \`createAppointment\` se ejecute con éxito, confirma la cita al usuario. Ejemplo: "¡Listo! Tu cita para el [fecha] a las [hora] ha sido confirmada. ¡Te esperamos!".

### POLÍTICAS
- **PROHIBIDO CONFIRMAR SIN USAR LA HERRAMIENTA:** NUNCA digas que una cita está confirmada si no has usado la herramienta \`createAppointment\` en el paso inmediatamente anterior.
- **NO INVENTES DISPONIBILIDAD:** Tu única fuente de verdad sobre los horarios es la herramienta \`getAvailableSlots\`.
- Sé siempre amable, servicial y representa al negocio de la mejor manera posible.`;


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
  userEmail: z.string().email().optional(),
});

const postMessageSchema = z.object({
  businessId: z.string(),
  sessionId: z.string(),
  message: z.string(),
  history: z.array(z.object({
    role: ChatRoleSchema,
    text: z.string(),
  })),
});


// --- Helper Functions ---
async function getBusinessChatHistory(businessId: string, sessionId: string): Promise<ChatMessage[]> {
    const db = getDbInstance();
    const messagesSnapshot = await db.collection('directory').doc(businessId)
      .collection('businessChatSessions').doc(sessionId)
      .collection('messages').orderBy('timestamp', 'asc').get();

    return messagesSnapshot.docs.map(doc => {
        const data = doc.data() as any;
        let role = data.role;
        if (role === 'model' && data.authorName) {
            role = 'admin';
        }
        return {
          id: doc.id,
          role: role,
          text: data.text,
          timestamp: data.timestamp.toDate().toISOString(),
          replyTo: data.replyTo || null,
        }
    });
}


// --- Server Actions ---

export async function startBusinessChatSessionAction(input: z.infer<typeof startSessionSchema>) {
    const db = getDbInstance();
    if (!FieldValue) throw new Error("Firebase Admin SDK is not fully initialized.");

    try {
        const validatedInput = startSessionSchema.parse(input);
        const { businessId, businessName, userName, userPhone, userEmail } = validatedInput;

        const newSessionRef = db.collection('directory').doc(businessId).collection('businessChatSessions').doc();
        await newSessionRef.set({
            userName,
            userPhone,
            userEmail,
            createdAt: FieldValue.serverTimestamp(),
            totalCost: 0,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalTokens: 0
        });
        
        const welcomeText = `¡Hola, ${userName}! Soy el asistente virtual de ${businessName}. ¿Cómo puedo ayudarte hoy?`;
        const initialHistory = [{ role: 'model' as const, text: welcomeText, timestamp: new Date().toISOString(), id: 'initial-message', replyTo: null }];

        await newSessionRef.collection('messages').add({
            text: welcomeText,
            role: 'model',
            timestamp: FieldValue.serverTimestamp(),
        });

        return { success: true, sessionId: newSessionRef.id, history: initialHistory };

    } catch (error) {
        console.error("Error starting business chat session:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors.map(e => e.message).join(', ') };
        }
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
        
        await messagesRef.add({
            text: message,
            role: 'user',
            timestamp: FieldValue.serverTimestamp(),
        });
        
        // --- Get the owner's agent config ---
        const businessDoc = await db.collection('directory').doc(businessId).get();
        const ownerUid = businessDoc.data()?.ownerUid;
        let agentConfig: BusinessAgentConfig = {
            model: 'googleai/gemini-1.5-flash-latest',
            systemPrompt: DEFAULT_BUSINESS_PROMPT,
        };

        if (ownerUid) {
            const userProfile = await getUserProfileByUid(ownerUid);
            if (userProfile?.businessProfile?.agentConfig) {
                // Use the custom prompt if available
                agentConfig.model = userProfile.businessProfile.agentConfig.model;
                agentConfig.systemPrompt = userProfile.businessProfile.agentConfig.systemPrompt;
            }
        }
        
        // --- Call the specialized business agent ---
        const aiResponse = await businessChat({
            businessId,
            chatHistory: history,
            currentMessage: message,
            agentConfig: {
                ...agentConfig,
                systemPrompt: agentConfig.systemPrompt.replace('{{currentDate}}', new Date().toISOString())
            }
        });

        if (aiResponse && aiResponse.response) {
            const cost = calculateCost(agentConfig.model, aiResponse.usage?.inputTokens || 0, aiResponse.usage?.outputTokens || 0);

            await db.runTransaction(async (transaction) => {
                const newMessageRef = messagesRef.doc();
                transaction.set(newMessageRef, {
                    text: aiResponse.response,
                    role: 'model',
                    timestamp: FieldValue.serverTimestamp(),
                    usage: aiResponse.usage,
                    cost: cost,
                });

                transaction.update(sessionRef, {
                    totalInputTokens: FieldValue.increment(aiResponse.usage?.inputTokens || 0),
                    totalOutputTokens: FieldValue.increment(aiResponse.usage?.outputTokens || 0),
                    totalTokens: FieldValue.increment(aiResponse.usage?.totalTokens || 0),
                    totalCost: FieldValue.increment(cost),
                    updatedAt: FieldValue.serverTimestamp(),
                });
            });

            return { success: true, response: aiResponse.response };
        } else {
             throw new Error("La respuesta de la IA fue nula o inválida.");
        }

    } catch (error) {
        console.error("Error posting business message:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Error de IA: ${errorMessage}` };
    }
}

export async function getBusinessChatHistoryAction(input: { sessionId: string; businessId: string }) {
    try {
        const history = await getBusinessChatHistory(input.businessId, input.sessionId);
        return { success: true, history };
    } catch (error) {
        console.error("Error getting business chat history:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}


// --- Actions for Advertiser's Conversation Panel ---
async function getAdvertiserPlaceId(idToken: string): Promise<string | null> {
    if (!adminAuth || !adminDb) {
        throw new Error("Firebase Admin SDK is not initialized.");
    }
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userProfile = await getUserProfileByUid(decodedToken.uid);
        return userProfile?.businessProfile?.placeId || null;
    } catch (error) {
        console.error("Error verifying ID token:", error);
        throw new Error("No se pudo verificar la sesión del usuario.");
    }
}


export async function getBusinessChatSessionsAction(idToken: string) {
    try {
        const placeId = await getAdvertiserPlaceId(idToken);
        if (!placeId) return { sessions: [] };

        const db = getDbInstance();
        const snapshot = await db.collection('directory').doc(placeId).collection('businessChatSessions').orderBy('createdAt', 'desc').get();

        if (snapshot.empty) {
            return { sessions: [] };
        }

        const sessions = snapshot.docs.map(doc => {
             const data = doc.data();
             return {
                 id: doc.id,
                 userName: data.userName,
                 userPhone: data.userPhone,
                 createdAt: data.createdAt.toDate().toISOString(),
             } as ChatSessionWithTokens
        });

        return { sessions };
    } catch (error) {
        console.error("Error getting business chat sessions:", error);
        return { error: 'No se pudieron obtener las conversaciones.' };
    }
}


export async function getBusinessChatSessionDetailsAction(sessionId: string, businessId: string) {
    try {
        if (!businessId) throw new Error("Business ID is required.");
        
        const db = getDbInstance();
        const sessionRef = db.collection('directory').doc(businessId).collection('businessChatSessions').doc(sessionId);
        const [sessionDoc, messages, platformConfig] = await Promise.all([
            sessionRef.get(),
            getBusinessChatHistory(businessId, sessionId),
            getPlatformConfig()
        ]);
        
        if (!sessionDoc.exists) {
            return { error: 'Sesión no encontrada.' };
        }
        
        const sessionData = sessionDoc.data()!;
        const realCost = sessionData.totalCost || 0;
        const finalCost = realCost + (realCost * (platformConfig.profitMarginPercentage / 100));

        const session: ChatSessionWithTokens = {
            id: sessionDoc.id,
            userName: sessionData.userName,
            userPhone: sessionData.userPhone,
            createdAt: sessionData.createdAt.toDate().toISOString(),
            totalCost: finalCost,
            totalTokens: sessionData.totalTokens || 0,
            messageCount: messages.length,
            totalInputTokens: sessionData.totalInputTokens || 0,
            totalOutputTokens: sessionData.totalOutputTokens || 0,
        };
        
        return { session, messages };

    } catch (error) {
        console.error(`Error getting details for business session ${sessionId}:`, error);
        return { error: 'No se pudo obtener el detalle de la conversación.' };
    }
}


export async function postBusinessAdminMessageAction(input: {
    sessionId: string;
    businessId: string;
    text: string;
    authorName: string;
    replyTo?: ChatMessage['replyTo'];
}) {
    try {
        const db = getDbInstance();
        if (!FieldValue) throw new Error("Firebase Admin SDK is not fully initialized.");

        const { sessionId, businessId, text, authorName, replyTo } = input;
        
        const messageRef = db.collection('directory').doc(businessId).collection('businessChatSessions').doc(sessionId).collection('messages');
        const newDocRef = await messageRef.add({
            text,
            role: 'admin',
            authorName,
            timestamp: FieldValue.serverTimestamp(),
            replyTo: replyTo || null,
        });

        const newMessage: ChatMessage = {
            id: newDocRef.id,
            text,
            role: 'admin',
            authorName,
            timestamp: new Date().toISOString(),
            replyTo: replyTo || null,
        }

        revalidatePath(`/dashboard/advertiser/conversations/${sessionId}`);
        return { success: true, newMessage };
    } catch (error) {
        console.error("Error posting admin message:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `No se pudo enviar el mensaje: ${errorMessage}` };
    }
}

    