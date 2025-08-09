// src/lib/blog/application/update-blog-post.use-case.ts
import type { BlogPost } from '../domain/blog-post.entity';
import type { BlogPostRepository } from '../domain/blog.repository';

/**
 * Use case for updating an existing blog post.
 */
export class UpdateBlogPostUseCase {
  constructor(private readonly blogPostRepository: BlogPostRepository) {}

  async execute(id: string, data: Partial<BlogPost>): Promise<BlogPost> {
    const postToUpdate = { ...data };
    
    // If the title is being changed, regenerate the slug
    if (data.title) {
        postToUpdate.slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    return this.blogPostRepository.update(id, postToUpdate);
  }
}
