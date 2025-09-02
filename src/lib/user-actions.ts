

'use server';

import { adminDb } from './firebase/admin-config';
import type { UserRole, CandidateProfile, UserProfile } from './types';
import { revalidatePath } from "next/cache";
import { uploadFile } from './user/infrastructure/storage/firebase-storage.adapter';
import { cookies } from 'next/headers';
import { adminAuth } from './firebase/admin-config';

export async function updateCandidateProfileAction(uid: string, formData: FormData, idToken: string) {
     try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
        // Note: We send FormData directly, so Content-Type will be set automatically by fetch
        const response = await fetch(`${appUrl}/api/users/${uid}/candidate-profile`, {
            method: 'PUT',
            headers: {
                // Pass the fresh token in the Authorization header
                'Authorization': `Bearer ${idToken}`,
            },
            body: formData,
            cache: 'no-store',
        });
        
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error?.message || 'Failed to update profile via API.');
        }
        revalidatePath('/dashboard/candidate-profile');
        return { success: true, message: 'Perfil actualizado con éxito.' };

    } catch (error) {
        console.error("Error in updateCandidateProfileAction:", error);
        const message = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
        return { success: false, error: message };
    }
}


// --- Functions to be refactored or removed ---

export async function getBusinessAnalyticsAction(uid: string) {
    if (!adminDb) {
        throw new Error("Firebase Admin SDK not initialized.");
    }

    try {
        const sessionsSnapshot = await adminDb.collection('chatSessions')
            .where('businessOwnerUid', '==', uid)
            .get();

        let totalTokens = 0;
        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        let totalCost = 0;
        let totalConversations = sessionsSnapshot.size;

        sessionsSnapshot.forEach(doc => {
            const data = doc.data();
            totalTokens += data.totalTokens || 0;
            totalInputTokens += data.totalInputTokens || 0;
            totalOutputTokens += data.totalOutputTokens || 0;
            totalCost += data.totalCost || 0;
        });
        
        // This logic will be more complex later, including profit margins
        const totalFinalCost = totalCost;
        const profitMargin = 0;

        return {
            totalFinalCost,
            totalConversations,
            totalTokens,
            totalInputTokens,
            totalOutputTokens,
            profitMargin,
        };
    } catch (error) {
        console.error("Error fetching business analytics:", error);
        const defaultAnalytics = { totalFinalCost: 0, totalConversations: 0, totalTokens: 0, totalInputTokens: 0, totalOutputTokens: 0, profitMargin: 0 };
        return defaultAnalytics;
    }
}


export async function setUserSubscriptionPlanAction(userId: string, priceId: string) {
    if (!adminAuth) {
        throw new Error('Firebase Admin Auth is not initialized.');
    }

    let planName: 'free' | 'colombia' | 'espana' = 'free';
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_COLOMBIA) {
        planName = 'colombia';
    } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ESPANA) {
        planName = 'espana';
    }

    try {
        const user = await adminAuth.getUser(userId);
        const currentClaims = user.customClaims || {};

        const newClaims = {
            ...currentClaims,
            valeria_plan: planName,
        };
        
        await adminAuth.setCustomUserClaims(userId, newClaims);
        console.log(`[Stripe Webhook] Successfully set custom claim 'valeria_plan: ${planName}' for user ${userId}`);
        
        revalidatePath('/dashboard');
        
        return { success: true };

    } catch (error) {
        console.error(`[Stripe Webhook] Failed to set custom claims for user ${userId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: errorMessage };
    }
}
