// src/lib/guide/domain/guide.entity.ts

/**
 * Represents a downloadable guide entity.
 * This will store information about the PDF guides offered as lead magnets.
 */
export interface Guide {
  id: string; // Firestore document ID
  title: string;
  description: string;
  coverImageUrl: string; // URL to the cover image in Firebase Storage
  pdfUrl: string; // URL to the PDF file in Firebase Storage
  category: string;
  createdAt: Date;
  updatedAt: Date;
}
