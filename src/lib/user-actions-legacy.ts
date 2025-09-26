'use server';

// This file is intended for actions that have not yet been refactored
// into the full hexagonal architecture. Over time, functions in this
// file should be migrated and the file eventually removed.

import { revalidatePath } from 'next/cache';
import { FirestoreUserRepository } from './user/infrastructure/persistence/firestore-user.repository';
import type { AgentConfig } from './types';

/**
 * Gets the configuration for a specific agent from the `agentConfig` collection.
 * @param agentId The ID of the agent config to fetch (e.g., 'global', 'valeria_premium').
 * @returns The agent configuration object or an error.
 */
export async function getAgentConfigAction(agentId: 'global' | 'valeria_premium' = 'global') {
    try {
        const repo = new FirestoreUserRepository();
        const config = await repo.getAgentConfig(agentId);
        return { config };
    } catch (error) {
        console.error(`Error getting agent config for ${agentId}:`, error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { error: message };
    }
}

/**
 * Saves the configuration for a specific agent to the `agentConfig` collection.
 * @param agentId The ID of the agent config to save.
 * @param config The configuration data to save.
 * @returns A success or error object.
 */
export async function saveAgentConfigAction(agentId: string, config: AgentConfig) {
    try {
        const repo = new FirestoreUserRepository();
        await repo.saveAgentConfig(agentId, config);
        revalidatePath('/dashboard/admin/agent');
        return { success: true };
    } catch (error) {
        console.error(`Error saving agent config for ${agentId}:`, error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { error: message };
    }
}
