// src/lib/blog/application/get-blog-post.use-case.ts
import type { BlogPost } from '../domain/blog-post.entity';
import type { BlogPostRepository } from '../domain/blog.repository';

/**
 * Use case for fetching a single blog post.
 */
export class GetBlogPostUseCase {
  constructor(private readonly blogPostRepository: BlogPostRepository) {}

  async executeById(id: string): Promise<BlogPost | null> {
    return this.blogPostRepository.findById(id);
  }

  async executeBySlug(slug: string): Promise<BlogPost | null> {
    return this.blogPostRepository.findBySlug(slug);
  }
}
