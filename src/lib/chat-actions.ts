
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
  userEmail: z.string().email().optional(),
});

export async function startChatSessionAction(input: z.infer<typeof startSessionSchema>) {
  try {
    const validatedInput = startSessionSchema.parse(input);
    
    // Always start a new session for simplicity and to ensure a clean state.
    // The client-side localStorage will handle session resumption.
    const sessionId = await startChatSession(validatedInput);
    const agentConfig = await getAgentConfig();

    const welcomeMessage = agentConfig.systemPrompt.includes('inmigración')
        ? '¡Hola! Soy tu asistente de inmigración para España. ¿Cómo puedo ayudarte hoy?'
        : '¡Hola! ¿Cómo puedo ayudarte hoy?';
    
    // The history only needs the first message to be returned to the client
    const initialHistory = [{ role: 'model' as const, text: welcomeMessage, timestamp: new Date().toISOString() }];
    
    // Save the initial welcome message to the new session's history in the DB
    await saveMessage(sessionId, { text: welcomeMessage, role: 'model' });

    return { success: true, sessionId, history: initialHistory };

  } catch (error) {
    console.error("Error starting chat session action:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";

    if (error instanceof z.ZodError) {
        return { success: false, error: error.errors.map(e => e.message).join(', ') };
    }
    
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


export async function getChatHistoryAction(input: { sessionId: string }) {
    try {
        const history = await getChatHistory(input.sessionId);
        return { success: true, history };
    } catch (error) {
        console.error("Error getting chat history:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

    
