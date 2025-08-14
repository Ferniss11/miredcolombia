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
  imageUrl?: string; // Optional URL for a promotional image
  isFeatured: boolean; // For future monetization
  status: 'published' | 'pending_review' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
