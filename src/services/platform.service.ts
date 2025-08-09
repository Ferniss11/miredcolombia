
'use server';

import { adminDb } from "@/lib/firebase/admin-config";
import type { PlatformConfig, PlatformCosts } from "@/lib/types";

const PLATFORM_CONFIG_DOC_ID = 'platformConfig'; // The collection is platformConfig

/**
 * Retrieves the main platform configuration from Firestore.
 */
export async function getPlatformConfig(): Promise<PlatformConfig> {
  if (!adminDb) {
    console.warn("Platform config using default because Firebase Admin SDK is not initialized.");
    return {
      profitMarginPercentage: 0,
    };
  }

  const docRef = adminDb.collection(PLATFORM_CONFIG_DOC_ID).doc('main');
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    return docSnap.data() as PlatformConfig;
  }

  // Return a default configuration if none is found
  return {
    profitMarginPercentage: 0,
  };
}

/**
 * Saves the main platform configuration to Firestore.
 */
export async function savePlatformConfig(config: PlatformConfig): Promise<void> {
  if (!adminDb) {
      throw new Error("Firebase Admin SDK is not initialized. Cannot save platform config.");
  }
  const docRef = adminDb.collection(PLATFORM_CONFIG_DOC_ID).doc('main');
  await docRef.set(config, { merge: true });
}


/**
 * Calculates the total AI costs across the platform.
 */
export async function getPlatformAiCosts(): Promise<PlatformCosts> {
    if (!adminDb) {
        console.warn("AI costs are zero because Firebase Admin SDK is not initialized.");
        return { totalCost: 0, chatCost: 0, contentCost: 0 };
    }

    // 1. Calculate Chat Costs
    const chatSessionsSnapshot = await adminDb.collection('chatSessions').get();
    let chatCost = 0;
    chatSessionsSnapshot.forEach(doc => {
        chatCost += doc.data().totalCost || 0;
    });

    // 2. Calculate Content Generation Costs
    const postsSnapshot = await adminDb.collection('posts').get();
    let contentCost = 0;
    postsSnapshot.forEach(doc => {
        contentCost += doc.data().generationCost || 0;
    });
    
    const totalCost = chatCost + contentCost;
    
    return {
        totalCost,
        chatCost,
        contentCost,
    };
}
