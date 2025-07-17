
'use server';

import { z } from 'zod';
import { adminDb, adminInstance } from "@/lib/firebase/admin-config";
import type { ChatMessage, ChatSession } from '@/lib/chat-types';
import { ChatRoleSchema } from '@/lib/chat-types';
import { businessChat } from '@/ai/businessAgent/flows/business-chat-flow';
import { getUserProfileByUid } from '@/services/admin.service';
import type { BusinessAgentConfig } from '@/lib/types';

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
        if (role === 'model' && data.authorName) {
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
                agentConfig = userProfile.businessProfile.agentConfig;
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

    } catch (error) {
        console.error("Error posting business message:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Error de IA: ${errorMessage}` };
    }
}
