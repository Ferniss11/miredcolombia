
'use server';

import { getAgentConfig, saveAgentConfig } from "@/services/agent.service";
import type { AgentConfig } from "./chat-types";
import { revalidatePath } from "next/cache";

export async function getAgentConfigAction(): Promise<{ config?: AgentConfig; error?: string }> {
    try {
        const config = await getAgentConfig();
        return { config };
    } catch (error) {
        console.error("Error in getAgentConfigAction:", error);
        return { error: "Could not retrieve agent configuration." };
    }
}

export async function saveAgentConfigAction(config: AgentConfig): Promise<{ success: boolean; error?: string }> {
    try {
        await saveAgentConfig(config);
        revalidatePath('/dashboard/admin/agent'); // Revalidate the path to show new config
        return { success: true };
    } catch (error) {
        console.error("Error in saveAgentConfigAction:", error);
        return { success: false, error: "Could not save agent configuration." };
    }
}
