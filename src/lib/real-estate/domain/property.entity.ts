// src/lib/real-estate/domain/property.entity.ts

/**
 * Represents the canonical entity for a real estate property listing.
 * This is the single source of truth for a property's structure in the application domain.
 */
export interface Property {
  // Core Information
  id: string; // Firestore document ID
  title: string;
  description: string;
  listingType: 'rent' | 'sale';
  propertyType: 'apartment' | 'house' | 'room'; // For renting rooms in a shared flat
  price: number; // For sale: total price. For rent: price per month.
  area: number; // Square meters
  images: string[]; // Array of image URLs
  address: string; // Full address
  location: { // Geo-coordinates
    lat: number;
    lng: number;
  };
  
  // Status and Moderation
  status: 'available' | 'rented' | 'sold' | 'pending_review' | 'rejected';
  
  // Property Details
  bedrooms: number;
  bathrooms: number;
  amenities: ('wifi' | 'heating' | 'ac' | 'kitchen' | 'washing_machine' | 'balcony' | 'pool' | 'gym')[];

  // Specifics for renting a room
  roomDetails?: {
    bedType: 'single' | 'double';
    isVerified: boolean; // Verified by our platform
  };
  totalRoomsInFlat?: number; // If it's a room in a shared flat

  // Details about flatmates for shared flats
  flatmates?: {
    gender: 'female_only' | 'male_only' | 'mixed';
    studentOnly: boolean;
    ageRange: [number, number];
  };

  // Rules and Contract details
  rules?: {
    petsAllowed: boolean;
    smokingAllowed: boolean;
  };
  contract?: {
    minStayNights: number;
    maxStayNights: number | null; // null for no maximum
  };

  // Detailed availability and pricing per month for rentals
  availability?: {
    month: string; // Format 'YYYY-MM'
    price: number;
    status: 'available' | 'occupied';
  }[];

  // Information about the owner/lister
  owner: {
    userId: string;
    name: string;
    isTrusted: boolean;
    responseRate?: number;
    avgResponseTimeHours?: number;
    joinedAt: Date;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
