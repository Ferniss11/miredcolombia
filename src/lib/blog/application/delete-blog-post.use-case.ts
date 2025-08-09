// src/lib/blog/application/delete-blog-post.use-case.ts
import type { BlogPostRepository } from '../domain/blog.repository';

/**
 * Use case for deleting a blog post.
 */
export class DeleteBlogPostUseCase {
  constructor(private readonly blogPostRepository: BlogPostRepository) {}

  async execute(id: string): Promise<void> {
    // Business logic could be added here, e.g., checking permissions,
    // logging the deletion, etc.
    return this.blogPostRepository.delete(id);
  }
}
