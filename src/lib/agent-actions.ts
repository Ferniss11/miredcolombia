
'use server';

import { AgentConfigSchema, type AgentConfig } from "./types";
import { getAgentConfig, saveAgentConfig } from "@/services/agent.service";
import { getAllChatSessions, getChatHistory, getChatSessionById, saveAdminMessage } from "@/services/chat.service";
import { revalidatePath } from "next/cache";


export async function getAgentConfigAction() {
    try {
        const config = await getAgentConfig();
        return { config };
    } catch (error) {
        console.error("Error getting agent config:", error);
        return { error: 'No se pudo obtener la configuración del agente.' };
    }
}

export async function saveAgentConfigAction(config: AgentConfig) {
    try {
        const validatedConfig = AgentConfigSchema.parse(config);
        await saveAgentConfig(validatedConfig);
        revalidatePath('/dashboard/admin/agent');
        return { success: true };
    } catch (error) {
        console.error("Error saving agent config:", error);
        return { error: 'No se pudo guardar la configuración del agente.' };
    }
}

export async function getChatSessionsAction() {
    try {
        const sessions = await getAllChatSessions();
        return { sessions };
    } catch (error) {
        console.error("Error getting chat sessions:", error);
        return { error: 'No se pudieron obtener las conversaciones.' };
    }
}


export async function getChatSessionDetailsAction(sessionId: string) {
    try {
        const session = await getChatSessionById(sessionId);
        if (!session) {
            return { error: 'Sesión no encontrada.' };
        }
        const messages = await getChatHistory(sessionId);
        return { session, messages };
    } catch (error) {
        console.error(`Error getting details for session ${sessionId}:`, error);
        return { error: 'No se pudo obtener el detalle de la conversación.' };
    }
}


export async function postAdminMessageAction(input: { sessionId: string; text: string; authorName: string }) {
    try {
        const { sessionId, text, authorName } = input;
        const newMessage = await saveAdminMessage(sessionId, text, authorName);
        revalidatePath(`/dashboard/admin/conversations/${sessionId}`);
        return { success: true, newMessage };
    } catch (error) {
        console.error("Error posting admin message:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `No se pudo enviar el mensaje: ${errorMessage}` };
    }
}
