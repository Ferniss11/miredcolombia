// src/lib/blog/infrastructure/api/blog.controller.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiResponse } from '@/lib/platform/api/api-response';
import { adminAuth } from '@/lib/firebase/admin-config';

// Infrastructure
import { FirestoreBlogPostRepository } from '../persistence/firestore-blog.repository';

// Application Use Cases
import { CreateBlogPostUseCase } from '../../application/create-blog-post.use-case';
import { GetAllBlogPostsUseCase } from '../../application/get-all-blog-posts.use-case';
import { GetBlogPostUseCase } from '../../application/get-blog-post.use-case';
import { UpdateBlogPostUseCase } from '../../application/update-blog-post.use-case';
import { DeleteBlogPostUseCase } from '../../application/delete-blog-post.use-case';

// Validation Schemas
const BlogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  // Add other fields from your BlogPost entity for validation
  // For simplicity, we'll keep it minimal here
  status: z.enum(['Published', 'Draft', 'In Review', 'Archived']),
  category: z.string().min(1, "Category is required"),
  introduction: z.string(),
  conclusion: z.string(),
  sections: z.array(z.any()), // Basic validation, can be improved
}).partial();


export class BlogController {
  private createPostUseCase: CreateBlogPostUseCase;
  private getAllPostsUseCase: GetAllBlogPostsUseCase;
  private getPostUseCase: GetBlogPostUseCase;
  private updatePostUseCase: UpdateBlogPostUseCase;
  private deletePostUseCase: DeleteBlogPostUseCase;

  constructor() {
    const blogPostRepository = new FirestoreBlogPostRepository();
    
    this.createPostUseCase = new CreateBlogPostUseCase(blogPostRepository);
    this.getAllPostsUseCase = new GetAllBlogPostsUseCase(blogPostRepository);
    this.getPostUseCase = new GetBlogPostUseCase(blogPostRepository);
    this.updatePostUseCase = new UpdateBlogPostUseCase(blogPostRepository);
    this.deletePostUseCase = new DeleteBlogPostUseCase(blogPostRepository);
  }

  async create(req: NextRequest): Promise<ApiResponse> {
    const json = await req.json();
    // Validate with a more complete schema if needed
    const postData = json;
    
    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) return ApiResponse.unauthorized();
    const { uid, name } = await adminAuth.verifyIdToken(idToken);

    const newPost = await this.createPostUseCase.execute(postData, uid, name || 'Admin');
    return ApiResponse.created(newPost);
  }
  
  async getAll(req: NextRequest): Promise<ApiResponse> {
    const posts = await this.getAllPostsUseCase.execute();
    return ApiResponse.success(posts);
  }

  async getById(req: NextRequest, { params }: { params: { id: string } }): Promise<ApiResponse> {
    const post = await this.getPostUseCase.executeById(params.id);
    if (!post) {
      return ApiResponse.notFound('Blog post not found.');
    }
    return ApiResponse.success(post);
  }

  async update(req: NextRequest, { params }: { params: { id: string } }): Promise<ApiResponse> {
    const json = await req.json();
    const dataToUpdate = BlogPostSchema.parse(json);
    
    const updatedPost = await this.updatePostUseCase.execute(params.id, dataToUpdate);
    return ApiResponse.success(updatedPost);
  }

  async delete(req: NextRequest, { params }: { params: { id: string } }): Promise<ApiResponse> {
    await this.deletePostUseCase.execute(params.id);
    return ApiResponse.noContent();
  }
}
