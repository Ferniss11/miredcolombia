
'use server';

import { getPlatformAiCosts, getPlatformConfig, savePlatformConfig } from "@/services/platform.service";
import type { PlatformConfig } from './types';

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
        return config;
    } catch (error) {
        console.error("Error getting platform config:", error);
        return { profitMarginPercentage: 0 };
    }
}

export async function savePlatformConfigAction(config: PlatformConfig) {
    try {
        await savePlatformConfig(config);
        return { success: true };
    } catch (error) {
        console.error("Error saving platform config:", error);
        return { error: 'No se pudo guardar la configuración.' };
    }
}
