// Defines the core shapes of user-related data (entities).
import { BusinessAgentConfig } from '@/lib/chat-types';

export type UserRole = 'Admin' | 'Advertiser' | 'User' | 'SAdmin' | 'Guest';

/**
 * Represents the profile data specific to a business advertiser.
 * This is an optional part of a User entity.
 */
export interface BusinessProfile {
  /**
   * The unique identifier from the Google Places API.
   * This is the primary key linking our user to a real-world business entity.
   */
  placeId: string;
  businessName: string;
  address: string;
  phone: string;
  website: string;
  description: string;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'unclaimed';
  isAgentEnabled: boolean;
  googleCalendarConnected?: boolean;
  agentConfig?: BusinessAgentConfig;
}

/**
 * Represents the profile data specific to a job candidate.
 * This is an optional part of a User entity.
 */
export interface CandidateProfile {
  professionalTitle?: string;
  summary?: string;
  skills?: string[];
  resumeUrl?: string; // URL al PDF en Firebase Storage
  experience?: Array<{
    jobTitle: string;
    company: string;
    startDate: string;
    endDate?: string;
    description: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    startDate: string;
    endDate?: string;
  }>;
}

/**
 * Represents the profile data for Valeria AI subscription.
 */
export interface ValeriaProfile {
    planId: 'valeria_premium' | 'valeria_pro' | 'free';
    planExpiresAt?: Date | null;
    sessionId?: string; // Link to the user's primary chat session
}


/**
 * The core User entity for the entire application.
 * It acts as a central hub for user information and can be composed
 * with specific profiles like BusinessProfile or CandidateProfile.
 */
export interface User {
  readonly uid: string; // Corresponds to Firebase Auth UID, immutable.
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'deleted'; // For soft-delete functionality
  createdAt: Date;
  updatedAt: Date;

  // Optional, composite profiles. Their existence defines the user's capabilities.
  businessProfile?: BusinessProfile;
  candidateProfile?: CandidateProfile;
  valeriaProfile?: ValeriaProfile;
}
