// src/lib/user-actions-legacy.ts

// This file is intended for actions that have not yet been refactored
// into the full hexagonal architecture. Over time, functions in this
// file should be migrated and the file eventually removed.

'use server';

import { revalidatePath } from 'next/cache';
import { FirestoreUserRepository } from './user/infrastructure/persistence/firestore-user.repository';
import type { AgentConfig } from './types';


export async function getGlobalAgentConfigAction() {
    try {
        const repo = new FirestoreUserRepository();
        const config = await repo.getGlobalAgentConfig();
        return { config };
    } catch (error) {
        console.error("Error getting global agent config:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { error: message };
    }
}

export async function saveGlobalAgentConfigAction(config: AgentConfig) {
    try {
        const repo = new FirestoreUserRepository();
        await repo.saveGlobalAgentConfig(config);
        revalidatePath('/dashboard/admin/agent');
        return { success: true };
    } catch (error) {
        console.error("Error saving global agent config:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { error: message };
    }
}
