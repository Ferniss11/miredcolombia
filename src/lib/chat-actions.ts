
'use server';

import { z } from 'zod';
import { startChatSession, saveMessage, findSessionByPhone, getChatHistory } from '@/services/chat.service';
import { chat } from '@/ai/flows/chat-flow';
import type { ChatMessage } from '@/lib/types';
import { getAgentConfig } from '@/services/agent.service';

const startSessionSchema = z.object({
  userName: z.string().min(2, "El nombre es obligatorio."),
  userPhone: z.string().min(7, "El teléfono es obligatorio."),
});

export async function startChatSessionAction(input: z.infer<typeof startSessionSchema>) {
  try {
    const validatedInput = startSessionSchema.parse(input);
    
    let existingSession = await findSessionByPhone(validatedInput.userPhone);
    
    if (existingSession) {
      const history = await getChatHistory(existingSession.id);
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
    
    if (errorMessage.includes('requires an index')) {
        return { success: false, error: errorMessage, isIndexError: true };
    }

    return { success: false, error: `No se pudo iniciar el chat: ${errorMessage}` };
  }
}

const postMessageSchema = z.object({
  sessionId: z.string(),
  message: z.string(),
  history: z.array(z.object({
      role: z.enum(['user', 'model']),
      text: z.string(),
  })),
});

// Helper to format the history into a single string
const formatHistoryAsPrompt = (history: ChatMessage[]): string => {
    return history.map(msg => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.text}`).join('\n');
}

export async function postMessageAction(input: z.infer<typeof postMessageSchema>) {
  try {
    const { sessionId, message, history } = postMessageSchema.parse(input);

    await saveMessage(sessionId, { text: message, role: 'user' });
    
    // Format the entire conversation history + new message as a single string
    const fullPrompt = `${formatHistoryAsPrompt(history)}\nUsuario: ${message}`;
    
    const agentConfig = await getAgentConfig();

    const aiResponse = await chat({
        systemPrompt: agentConfig.systemPrompt,
        prompt: fullPrompt,
    });

    if (aiResponse && aiResponse.response) {
        await saveMessage(sessionId, { text: aiResponse.response, role: 'model' }, aiResponse.usage);
        return { success: true, response: aiResponse.response };
    } else {
        throw new Error("La respuesta de la IA fue nula o inválida.");
    }

  } catch (error) {
    console.error("Error posting message:", error);
    const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
    return { success: false, error: `Error de IA: ${errorMessage}` };
  }
}
