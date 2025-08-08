// src/lib/directory/domain/business.entity.ts

import type { BusinessAgentConfig } from '@/lib/chat-types';
import type { Photo, Review } from '@/lib/types';

/**
 * Represents the canonical structure for a business listing in the directory.
 * This entity is the single source of truth for business data within the application domain.
 */
export interface Business {
  id: string; // The Google Place ID, acting as the primary key.
  
  // Core Information
  displayName: string;
  category: string; // The category assigned in our system (e.g., Restaurante, Moda).
  
  // Contact and Location
  formattedAddress: string;
  city: string;
  internationalPhoneNumber?: string;
  website?: string;
  geometry?: {
      location: {
          lat: number;
          lng: number;
      }
  };
  
  // Status and Ownership
  ownerUid?: string | null; // UID of the advertiser user who owns this.
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'unclaimed';
  
  // Platform-specific Features
  subscriptionTier: 'Gratuito' | 'Básico' | 'Premium' | 'Destacado';
  isFeatured: boolean;
  isAgentEnabled: boolean;
  agentConfig?: BusinessAgentConfig;

  // Google Places Data
  rating?: number;
  userRatingsTotal?: number;
  openingHours?: string[];
  isOpenNow?: boolean;
  
  // Media and Reviews
  photoUrl?: string; // Main photo URL for list views.
  photos?: Photo[];
  reviews?: Review[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
