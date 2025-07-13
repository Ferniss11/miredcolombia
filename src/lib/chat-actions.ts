
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
    
    // Check for an existing session with this phone number
    const existingSession = await findSessionByPhone(validatedInput.userPhone);
    
    if (existingSession) {
      // If a session exists, return its ID and history
      const history = await getChatHistory(existingSession.id);
      return { success: true, sessionId: existingSession.id, history };
    } else {
      // If no session exists, create a new one
      const sessionId = await startChatSession(validatedInput);
      // For a new user, we return the new session ID and an empty history array.
      // The client will provide the initial welcome message.
      return { success: true, sessionId, history: [] };
    }

  } catch (error) {
    console.error("Error starting chat session:", error);
    const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
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

    // 1. Save user's message to Firestore
    await saveMessage(sessionId, { text: message, role: 'user' });

    // 2. Call the Genkit AI flow
    const aiResponse = await invokeChatFlow({ message, history });

    // 3. Save AI's response to Firestore
    await saveMessage(sessionId, { text: aiResponse.response, role: 'model' });

    return { success: true, response: aiResponse.response };

  } catch (error) {
    console.error("Error posting message:", error);
    const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
    return { success: false, error: `Error de IA: ${errorMessage}` };
  }
}
