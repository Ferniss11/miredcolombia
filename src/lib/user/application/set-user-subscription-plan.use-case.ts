
// src/lib/user/application/set-user-subscription-plan.use-case.ts
import { adminAuth } from '@/lib/firebase/admin-config';
import type { UserRepository } from '../domain/user.repository';

export type SetUserSubscriptionPlanInput = {
  userId: string;
  planId: string; // This is our internal planId, e.g., 'valeria_premium'
};

/**
 * Use case to set the user's subscription plan.
 * This is the single source of truth for updating user permissions after a purchase.
 */
export class SetUserSubscriptionPlanUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({ userId, planId }: SetUserSubscriptionPlanInput): Promise<void> {
    if (!adminAuth) {
      throw new Error('Firebase Admin Auth is not initialized.');
    }
    
    // Convert our internal plan ID to the claim value
    let planClaimValue: 'valeria_premium' | 'free' = 'free';

    if (planId === 'valeria_premium') {
        planClaimValue = 'valeria_premium';
    }

    if (planClaimValue === 'free') {
        console.warn(`[SetUserSubscriptionPlanUseCase] Received a free or unknown planId: ${planId} for user ${userId}. No claim will be set.`);
        return;
    }

    // 1. Update the custom claims on the user's auth token
    const { customClaims } = await adminAuth.getUser(userId);
    // Ensure we are not overwriting other roles or important claims
    const currentRoles = customClaims?.roles || [];
    const newClaims = {
        ...customClaims,
        roles: currentRoles, // Preserve existing roles
        valeria_plan: planClaimValue,
    };
    await adminAuth.setCustomUserClaims(userId, newClaims);
    
    console.log(`[SetUserSubscriptionPlanUseCase] Successfully set custom claim 'valeria_plan: ${planClaimValue}' for user ${userId}`);

    // 2. (Optional but recommended) Update the user's profile in Firestore for redundancy
    await this.userRepository.update(userId, { 
      'valeriaProfile.planId': planClaimValue,
      'valeriaProfile.planExpiresAt': null, // For now, we assume non-expiring subscriptions. Could be set from Stripe data.
    } as any);
  }
}
