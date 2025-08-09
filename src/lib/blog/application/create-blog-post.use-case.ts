// src/lib/blog/application/create-blog-post.use-case.ts
import type { BlogPost } from '../domain/blog-post.entity';
import type { BlogPostRepository } from '../domain/blog.repository';

export type CreateBlogPostInput = Omit<BlogPost, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'date'>;

/**
 * Use case for creating a new blog post.
 */
export class CreateBlogPostUseCase {
  constructor(private readonly blogPostRepository: BlogPostRepository) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // remove special characters
      .replace(/\s+/g, '-')        // replace spaces with hyphens
      .replace(/-+/g, '-');         // remove consecutive hyphens
  }

  async execute(input: CreateBlogPostInput, authorId: string, authorName: string): Promise<BlogPost> {
    const slug = this.generateSlug(input.title);

    const postToCreate: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'> = {
      ...input,
      slug,
      authorId,
      author: authorName,
      date: new Date().toISOString(),
    };
    
    return this.blogPostRepository.create(postToCreate, authorId, authorName);
  }
}
