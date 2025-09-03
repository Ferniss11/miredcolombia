// src/lib/user-actions-legacy.ts

// This file is intended for actions that have not yet been refactored
// into the full hexagonal architecture. Over time, functions in this
// file should be migrated and the file eventually removed.

'use server';

import { revalidatePath } from 'next/cache';
import { FirestoreUserRepository } from './user/infrastructure/persistence/firestore-user.repository';
import type { AgentConfig } from './types';


export async function getAgentConfigAction(agentId: string = 'global') {
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
