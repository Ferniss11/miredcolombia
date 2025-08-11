
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { BlogPost } from './types';
import { cookies } from 'next/headers';
import { GetBlogPostUseCase } from './blog/application/get-blog-post.use-case';
import { FirestoreBlogPostRepository } from './blog/infrastructure/persistence/firestore-blog.repository';
import { adminAuth } from './firebase/admin-config';
import { CreateBlogPostUseCase } from './blog/application/create-blog-post.use-case';
import { GetAllBlogPostsUseCase } from './blog/application/get-all-blog-posts.use-case';
import { UpdateBlogPostUseCase } from './blog/application/update-blog-post.use-case';
import { DeleteBlogPostUseCase } from './blog/application/delete-blog-post.use-case';

const BlogPostActionSchema = z.object({
  title: z.string(),
  introduction: z.string(),
  featuredImageUrl: z.string().optional(),
  featuredImageHint: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      content: z.string(),
      imageUrl: z.string().optional(),
      imageHint: z.string().optional(),
    })
  ),
  conclusion: z.string(),
  suggestedTags: z.array(z.string()),
  category: z.string(),
  status: z.enum(['Published', 'Draft', 'In Review', 'Archived']),
  slug: z.string().optional(),
  generationCost: z.number().optional(),
});

type BlogPostInput = z.infer<typeof BlogPostActionSchema>;


export async function createBlogPostAction(input: Omit<BlogPostInput, 'slug'>, idToken: string) {
  try {
    const blogRepository = new FirestoreBlogPostRepository();
    const createUseCase = new CreateBlogPostUseCase(blogRepository);

    const { uid, name } = await adminAuth.verifyIdToken(idToken);
    const newPost = await createUseCase.execute(input, uid, name || 'Admin');
    
    revalidatePath('/dashboard/admin/blog');
    revalidatePath('/blog');
    revalidatePath('/'); // Revalidate home page as well

    return { success: true, post: newPost };
  } catch (error) {
    console.error('Error in createBlogPostAction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Could not create blog post: ${errorMessage}` };
  }
}

export async function getBlogPostsAction(): Promise<{ posts?: BlogPost[], error?: string }> {
    try {
        const blogRepository = new FirestoreBlogPostRepository();
        const useCase = new GetAllBlogPostsUseCase(blogRepository);
        const posts = await useCase.execute();
        return { posts };
    } catch (error) {
        console.error('Error fetching all blog posts:', error);
        return { error: 'No se pudieron obtener las entradas del blog.' };
    }
}

export async function getPublishedBlogPosts(): Promise<{ posts: BlogPost[], error?: string }> {
    try {
        const blogRepository = new FirestoreBlogPostRepository();
        const useCase = new GetAllBlogPostsUseCase(blogRepository);
        const posts = await useCase.execute(true); // Fetch only published posts
        return { posts };
    } catch (error) {
        console.error('Error fetching published blog posts:', error);
        return { posts: [], error: 'Could not fetch published posts.' };
    }
}


export async function getBlogPostBySlug(slug: string): Promise<{ post: BlogPost | null, error?: string }> {
    try {
        const blogRepository = new FirestoreBlogPostRepository();
        const useCase = new GetBlogPostUseCase(blogRepository);
        const post = await useCase.executeBySlug(slug);
        if (!post) return { post: null };
        return { post };
    } catch (error) {
        console.error('Error fetching post by slug:', error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return { post: null, error: message };
    }
}


export async function getBlogPostByIdAction(id: string) {
    try {
        const blogRepository = new FirestoreBlogPostRepository();
        const useCase = new GetBlogPostUseCase(blogRepository);
        const post = await useCase.executeById(id);
        if (!post) return { error: 'No se encontró la entrada.' };
        return { post };
    } catch (error) {
        console.error('Error fetching post by ID:', error);
        return { error: 'No se pudo obtener la entrada.' };
    }
}


export async function updateBlogPostAction(id: string, data: Partial<BlogPost>) {
     try {
        const blogRepository = new FirestoreBlogPostRepository();
        const updateUseCase = new UpdateBlogPostUseCase(blogRepository);
        await updateUseCase.execute(id, data);
        
        revalidatePath('/dashboard/admin/blog');
        revalidatePath(`/blog/preview/${id}`);
        revalidatePath('/'); // Revalidate home page
        if (data.slug) {
            revalidatePath(`/blog/${data.slug}`);
        }
        return { success: true };
    } catch (error) {
        console.error('Error updating post:', error);
        const message = error instanceof Error ? error.message : 'No se pudo actualizar la entrada.';
        return { success: false, error: message };
    }
}


export async function updateBlogPostStatusAction(id: string, status: 'Published' | 'Draft' | 'In Review' | 'Archived') {
    return updateBlogPostAction(id, { status });
}

export async function deleteBlogPostAction(id: string) {
     try {
        const blogRepository = new FirestoreBlogPostRepository();
        const deleteUseCase = new DeleteBlogPostUseCase(blogRepository);
        await deleteUseCase.execute(id);

        revalidatePath('/dashboard/admin/blog');
        revalidatePath('/blog');
        revalidatePath('/'); // Revalidate home page
        return { success: true };
    } catch (error) {
        console.error('Error deleting post:', error);
        const message = error instanceof Error ? error.message : 'No se pudo eliminar la entrada.';
        return { success: false, error: message };
    }
}
