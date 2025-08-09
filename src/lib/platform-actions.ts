
'use server';

import { getPlatformAiCosts, getPlatformConfig, savePlatformConfig } from "@/services/platform.service";
import type { PlatformConfig, PlatformCosts } from './types';
import { revalidatePath } from "next/cache";

export async function getPlatformAiCostsAction() {
    try {
        const costs = await getPlatformAiCosts();
        return costs;
    } catch (error) {
        console.error("Error getting platform AI costs:", error);
        return { totalCost: 0, chatCost: 0, contentCost: 0 };
    }
}

export async function getPlatformConfigAction() {
    try {
        const config = await getPlatformConfig();
        // Return a plain object, not { config: config }
        return config;
    } catch (error) {
        console.error("Error getting platform config:", error);
        // Return a default object on error to prevent crashes
        return { profitMarginPercentage: 0 };
    }
}

export async function savePlatformConfigAction(config: PlatformConfig) {
    try {
        await savePlatformConfig(config);
        revalidatePath('/dashboard/admin/economics');
        revalidatePath('/dashboard/admin/agent');
        return { success: true };
    } catch (error) {
        console.error("Error saving platform config:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { error: message };
    }
}
