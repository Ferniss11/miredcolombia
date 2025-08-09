// src/lib/job-application/domain/job-application.entity.ts

import type { CandidateProfile } from '@/lib/user/domain/user.entity';

export type ApplicationStatus = 'received' | 'in_review' | 'rejected' | 'contacted';

/**
 * Represents a single job application.
 * This entity links a candidate (User) to a specific JobPosting.
 */
export interface JobApplication {
  id: string; // Firestore document ID
  jobId: string;
  jobTitle: string; // Denormalized for easier display
  candidateId: string; // UID of the user applying
  advertiserId: string; // UID of the user who posted the job
  applicationDate: Date;
  status: ApplicationStatus;
  
  /**
   * A snapshot of the candidate's profile at the moment of application.
   * This ensures that the advertiser sees the profile as it was when the candidate applied,
   * even if the candidate updates their profile later.
   */
  profileSnapshot: CandidateProfile;
}
