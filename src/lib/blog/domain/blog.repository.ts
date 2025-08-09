// src/lib/blog/domain/blog.repository.ts
import type { BlogPost } from './blog-post.entity';

/**
 * Defines the contract (port) for interacting with the blog data persistence layer.
 * This allows the application layer to be independent of the database implementation.
 */
export interface BlogPostRepository {
  /**
   * Saves a blog post entity to the persistence layer.
   * Can be used for both creation and updates.
   * @param post - The blog post entity to save.
   * @returns The saved blog post entity, possibly with a database-generated ID.
   */
  create(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>, authorId: string, authorName: string): Promise<BlogPost>;

  /**
   * Finds a blog post by its unique identifier.
   * @param id - The ID of the post.
   * @returns The BlogPost entity or null if not found.
   */
  findById(id: string): Promise<BlogPost | null>;

  /**
   * Finds a blog post by its URL slug.
   * @param slug - The slug of the post.
   * @returns The BlogPost entity or null if not found.
   */
  findBySlug(slug: string): Promise<BlogPost | null>;

  /**
   * Retrieves all blog posts from the repository.
   * @returns An array of BlogPost entities.
   */
  findAll(): Promise<BlogPost[]>;
  
  /**
   * Retrieves all posts with 'Published' status.
   * @returns An array of published BlogPost entities.
   */
  findPublished(): Promise<BlogPost[]>;

  /**
   * Updates specific fields of a blog post entity.
   * @param id - The ID of the post to update.
   * @param data - An object containing the fields to update.
   * @returns The updated BlogPost entity.
   */
  update(id: string, data: Partial<BlogPost>): Promise<BlogPost>;

  /**
   * Deletes a blog post from the repository.
   * @param id - The ID of the post to delete.
   * @returns A promise that resolves when the deletion is complete.
   */
  delete(id: string): Promise<void>;
}
