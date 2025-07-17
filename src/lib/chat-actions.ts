
'use server';

import { z } from 'zod';
import { startChatSession, saveMessage, findSessionByPhone, getChatHistory } from '@/services/chat.service';
import { migrationChat } from '@/ai/migrationAgent/flows/migration-chat-flow';
import type { ChatMessage } from '@/lib/chat-types';
import { getAgentConfig } from '@/services/agent.service';
import { ChatRoleSchema } from './chat-types';

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
        // This should theoretically not happen if a session exists, but as a fallback...
        const agentConfig = await getAgentConfig();
        const welcomeBackMessage = agentConfig.systemPrompt.includes('inmigración')
          ? '¡Hola de nuevo! Soy tu asistente de inmigración. ¿En qué más te puedo ayudar?'
          : '¡Hola de nuevo! ¿Cómo puedo ayudarte?';
        history.push({ role: 'model', text: welcomeBackMessage, timestamp: new Date().toISOString(), id: 'initial', replyTo: null });
      }
      return { success: true, sessionId: existingSession.id, history };
    } else {
      const sessionId = await startChatSession(validatedInput);
       const agentConfig = await getAgentConfig();
       const welcomeMessage = agentConfig.systemPrompt.includes('inmigración')
         ? '¡Hola! Soy tu asistente de inmigración para España. ¿Cómo puedo ayudarte hoy?'
         : '¡Hola! ¿Cómo puedo ayudarte hoy?';
      const initialHistory = [{ role: 'model' as const, text: welcomeMessage, timestamp: new Date().toISOString() }];
      return { success: true, sessionId, history: initialHistory };
    }

  } catch (error) {
    console.error("Error starting chat session action:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    
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
      role: ChatRoleSchema,
      text: z.string(),
      timestamp: z.string().optional(),
  })),
});


export async function postMessageAction(input: z.infer<typeof postMessageSchema>) {
  try {
    const { sessionId, message, history } = postMessageSchema.parse(input);

    await saveMessage(sessionId, { text: message, role: 'user' });
    
    // Fetch the latest global agent configuration
    const agentConfig = await getAgentConfig();

    // Call the AI flow with the dynamic configuration
    const aiResponse = await migrationChat({
        model: agentConfig.model,
        systemPrompt: agentConfig.systemPrompt,
        chatHistory: history,
        currentMessage: message,
    });

    if (aiResponse && aiResponse.response) {
        await saveMessage(sessionId, { text: aiResponse.response, role: 'model' }, aiResponse.usage);
        return { success: true, response: aiResponse.response };
    } else {
        throw new Error("La respuesta de la IA fue nula o inválida.");
    }

  } catch (error) {
    console.error("Error posting message:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Error de IA: ${errorMessage}` };
  }
}
