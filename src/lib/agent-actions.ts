
'use server';

import { AgentConfigSchema, type AgentConfig } from "./types";
import { getAgentConfig, saveAgentConfig } from "@/services/agent.service";
import { getAllChatSessions } from "@/services/chat.service";
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
