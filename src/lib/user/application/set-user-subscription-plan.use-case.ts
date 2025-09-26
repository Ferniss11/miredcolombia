
// src/lib/user/application/set-user-subscription-plan.use-case.ts
import { adminAuth } from '@/lib/firebase/admin-config';
import type { UserRepository } from '../domain/user.repository';

export type SetUserSubscriptionPlanInput = {
  userId: string;
  planId: string; // This is our internal planId, e.g., 'valeria_premium' or 'valeria_premium_quarterly'
  // New parameter for temporary access
  accessDurationDays?: number;
};

/**
 * Use case to set the user's subscription plan.
 * This is the single source of truth for updating user permissions after a purchase.
 */
export class SetUserSubscriptionPlanUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({ userId, planId, accessDurationDays }: SetUserSubscriptionPlanInput): Promise<void> {
    if (!adminAuth) {
      throw new Error('Firebase Admin Auth is not initialized.');
    }
    
    // Convert our internal plan ID to the claim value. Both quarterly and monthly plans grant the same 'premium' access level.
    let planClaimValue: 'valeria_premium' | 'free' = 'free';

    if (planId === 'valeria_premium' || planId === 'valeria_premium_quarterly') {
        planClaimValue = 'valeria_premium';
    }

    if (planClaimValue === 'free') {
        console.warn(`[SetUserSubscriptionPlanUseCase] Received a free or unknown planId: ${planId} for user ${userId}. No claim will be set.`);
        return;
    }

    // --- Set Custom Claim ---
    const { customClaims } = await adminAuth.getUser(userId);
    const newClaims = {
        ...customClaims,
        valeria_plan: planClaimValue,
    };
    await adminAuth.setCustomUserClaims(userId, newClaims);
    console.log(`[SetUserSubscriptionPlanUseCase] Successfully set custom claim 'valeria_plan: ${planClaimValue}' for user ${userId}`);
    
    // --- Update Firestore Profile ---
    let expiryDate: Date | null = null;
    if (accessDurationDays) {
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + accessDurationDays);
        console.log(`[SetUserSubscriptionPlanUseCase] Plan for user ${userId} will expire on: ${expiryDate.toISOString()}`);
    }

    await this.userRepository.update(userId, { 
      'valeriaProfile.planId': planClaimValue,
      'valeriaProfile.planExpiresAt': expiryDate,
    } as any);
  }
}
