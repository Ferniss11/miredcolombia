// src/lib/user/application/set-user-subscription-plan.use-case.ts
import { adminAuth } from '@/lib/firebase/admin-config';
import type { UserRepository } from '../domain/user.repository';

export type SetUserSubscriptionPlanInput = {
  userId: string;
  priceId: string;
};

/**
 * Use case to set the user's subscription plan.
 * This is the single source of truth for updating user permissions after a purchase.
 */
export class SetUserSubscriptionPlanUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({ userId, priceId }: SetUserSubscriptionPlanInput): Promise<void> {
    if (!adminAuth) {
      throw new Error('Firebase Admin Auth is not initialized.');
    }
    
    // The priceId coming from our webhook is now our internal plan name
    let planName: 'valeria_premium' | 'valeria_pro' | 'free' = 'free';

    if (priceId === 'valeria_premium') {
        planName = 'valeria_premium';
    } else if (priceId === 'valeria_pro') {
        planName = 'valeria_pro';
    }

    if (planName === 'free') {
        console.warn(`[SetUserSubscriptionPlanUseCase] Received an unknown or free priceId: ${priceId} for user ${userId}. No claim will be set.`);
        return;
    }

    // 1. Update the custom claims on the user's auth token
    const { customClaims } = await adminAuth.getUser(userId);
    const newClaims = {
        ...customClaims,
        valeria_plan: planName,
    };
    await adminAuth.setCustomUserClaims(userId, newClaims);
    
    console.log(`[SetUserSubscriptionPlanUseCase] Successfully set custom claim 'valeria_plan: ${planName}' for user ${userId}`);

    // 2. (Optional but recommended) Update the user's profile in Firestore for redundancy
    await this.userRepository.update(userId, { 
      'valeriaProfile.planId': planName,
      'valeriaProfile.planExpiresAt': null, // For now, we assume non-expiring subscriptions. Could be set from Stripe data.
    } as any);
  }
}
