
'use server';

import { z } from 'zod';
import { startChatSession, saveMessage } from '@/services/chat.service';
import { invokeChatFlow } from '@/ai/flows/chat-flow';

const startSessionSchema = z.object({
  userName: z.string().min(2, "El nombre es obligatorio."),
  userPhone: z.string().min(7, "El teléfono es obligatorio."),
});

export async function startChatSessionAction(input: z.infer<typeof startSessionSchema>) {
  try {
    const validatedInput = startSessionSchema.parse(input);
    const sessionId = await startChatSession(validatedInput);
    return { success: true, sessionId };
  } catch (error) {
    console.error("Error starting chat session:", error);
    return { success: false, error: 'No se pudo iniciar el chat. Por favor, inténtalo de nuevo.' };
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
