
'use server';

import { z } from 'zod';
import { startChatSession, saveMessage, findSessionByPhone, getChatHistory } from '@/services/chat.service';
import { invokeChatFlow } from '@/ai/flows/chat-flow';

const startSessionSchema = z.object({
  userName: z.string().min(2, "El nombre es obligatorio."),
  userPhone: z.string().min(7, "El teléfono es obligatorio."),
});

export async function startChatSessionAction(input: z.infer<typeof startSessionSchema>) {
  try {
    const validatedInput = startSessionSchema.parse(input);
    
    const existingSession = await findSessionByPhone(validatedInput.userPhone);
    
    if (existingSession) {
      const history = await getChatHistory(existingSession.id);
      // If user exists but has no history, provide a welcome message.
      if (history.length === 0) {
        history.push({ role: 'model', text: '¡Hola de nuevo! Soy tu asistente de inmigración. ¿En qué más te puedo ayudar?', timestamp: new Date().toISOString() });
      }
      return { success: true, sessionId: existingSession.id, history };
    } else {
      const sessionId = await startChatSession(validatedInput);
      const initialHistory = [{ role: 'model', text: '¡Hola! Soy tu asistente de inmigración para España. ¿Cómo puedo ayudarte hoy?', timestamp: new Date().toISOString() }];
      return { success: true, sessionId, history: initialHistory };
    }

  } catch (error) {
    console.error("Error starting chat session action:", error);
    const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
    
    // Check if it's the specific Firestore index error to handle it on the client
    if (errorMessage.includes('requires an index')) {
        return { success: false, error: errorMessage, isIndexError: true };
    }

    return { success: false, error: `No se pudo iniciar el chat: ${errorMessage}` };
  }
}

const postMessageSchema = z.object({
  sessionId: z.string(),
  message: z.string(),
  history: z.array(z.any()),
});

export async function postMessageAction(input: z.infer<typeof postMessageSchema>) {
  try {
    const { sessionId, message, history } = postMessageSchema.parse(input);

    await saveMessage(sessionId, { text: message, role: 'user' });

    const aiResponse = await invokeChatFlow({ message, history });

    await saveMessage(sessionId, { text: aiResponse.response, role: 'model' });

    return { success: true, response: aiResponse.response };

  } catch (error) {
    console.error("Error posting message:", error);
    const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
    return { success: false, error: `Error de IA: ${errorMessage}` };
  }
}
