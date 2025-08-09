// src/lib/service-listing/domain/service-listing.entity.ts

/**
 * Represents an announcement for a professional service offered by a user.
 */
export interface ServiceListing {
  id: string; // Firestore document ID
  userId: string; // The UID of the user offering the service
  title: string;
  description: string;
  category: string;
  city: string;
  price: number;
  priceType: 'per_hour' | 'fixed' | 'per_project';
  contactPhone: string;
  contactEmail: string;
  isFeatured: boolean; // For future monetization
  createdAt: Date;
  updatedAt: Date;
}
