// src/lib/blog/domain/blog-post.entity.ts

/**
 * Represents the canonical entity for a blog post.
 * This is the single source of truth for a blog post's structure in the application domain.
 */
export interface BlogPost {
  id: string; // Firestore document ID
  slug: string;
  title: string;
  author: string;
  authorId: string;
  date: string; // Should be ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  status: 'Published' | 'Draft' | 'In Review' | 'Archived';
  category: string;
  
  // Rich content from AI
  introduction: string;
  conclusion: string;
  sections: Array<{
    heading: string;
    content: string;
    imageUrl?: string;
    imageHint?: string;
  }>;
  featuredImageUrl?: string;
  featuredImageHint?: string;
  suggestedTags: string[];
  generationCost?: number; // Cost in EUR for generating this post

  // Optional placeholder fields for simpler posts that might exist
  excerpt?: string;
  content?: string;
  imageUrl?: string;
}
