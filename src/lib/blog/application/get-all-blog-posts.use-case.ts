// src/lib/blog/application/get-all-blog-posts.use-case.ts
import type { BlogPost } from '../domain/blog-post.entity';
import type { BlogPostRepository } from '../domain/blog.repository';

/**
 * Use case for fetching all blog posts.
 * Can be extended with filtering or pagination logic.
 */
export class GetAllBlogPostsUseCase {
  constructor(private readonly blogPostRepository: BlogPostRepository) {}

  async execute(publishedOnly: boolean = false): Promise<BlogPost[]> {
    if (publishedOnly) {
      return this.blogPostRepository.findPublished();
    }
    return this.blogPostRepository.findAll();
  }
}
