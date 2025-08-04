// Defines the core shapes of user-related data (entities).

export type UserRole = 'Admin' | 'Advertiser' | 'User';

/**
 * Represents the profile data specific to a business advertiser.
 * This is an optional part of a User entity.
 */
export interface BusinessProfile {
  placeId: string;
  businessName: string;
  address: string;
  phone: string;
  website: string;
  description: string;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'unclaimed';
  isAgentEnabled: boolean;
  googleCalendarConnected?: boolean;
}

/**
 * Represents the profile data specific to a job candidate.
 * This is an optional part of a User entity.
 */
export interface CandidateProfile {
  professionalTitle: string;
  summary: string;
  skills: string[];
  resumeUrl: string;
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
  createdAt: Date;
  updatedAt: Date;

  // Optional, composite profiles. Their existence defines the user's capabilities.
  businessProfile?: BusinessProfile;
  candidateProfile?: CandidateProfile;
}
