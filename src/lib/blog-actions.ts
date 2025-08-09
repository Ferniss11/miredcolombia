
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { BlogPost } from './types';
import { adminAuth } from './firebase/admin-config';
import { cookies } from 'next/headers';

// Import use cases and repository
import { CreateBlogPostUseCase } from './blog/application/create-blog-post.use-case';
import { GetAllBlogPostsUseCase } from './blog/application/get-all-blog-posts.use-case';
import { GetBlogPostUseCase } from './blog/application/get-blog-post.use-case';
import { UpdateBlogPostUseCase } from './blog/application/update-blog-post.use-case';
import { DeleteBlogPostUseCase } from './blog/application/delete-blog-post.use-case';
import { FirestoreBlogPostRepository } from './blog/infrastructure/persistence/firestore-blog.repository';


// --- Helper function to verify auth from a server action ---
const verifyAuthFromCookie = async () => {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) throw new Error('User not authenticated.');
    
    if (!adminAuth) throw new Error('Authentication service not configured.');
    
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userRoles = (decodedToken.roles || []) as string[];

    if (!userRoles.includes('Admin') && !userRoles.includes('SAdmin')) {
        throw new Error('User is not authorized to perform this action.');
    }
    
    return { uid: decodedToken.uid, name: decodedToken.name || 'Admin' };
};


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

/**
 * Creates a new blog post by calling the secure API route.
 * This is a server action called from the client.
 */
export async function createBlogPostAction(input: Omit<BlogPostInput, 'slug'>, idToken: string) {
  try {
    if (!idToken) {
        throw new Error('El token de autenticación es obligatorio.');
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const response = await fetch(`${appUrl}/api/blog`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(input),
        cache: 'no-store', 
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error?.message || `Error en el servidor: ${response.status}`);
    }
    
    revalidatePath('/dashboard/admin/blog');
    revalidatePath('/blog');

    return { success: true, post: result };
  } catch (error) {
    console.error('Error detallado en la acción del blog:', error);
    
    let errorMessage = 'Un error desconocido ocurrió.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    return {
      success: false,
      error: `No se pudo crear la entrada de blog: ${errorMessage}`,
    };
  }
}

export async function getBlogPostsAction(): Promise<{ posts?: BlogPost[], error?: string }> {
    try {
        const blogPostRepository = new FirestoreBlogPostRepository();
        const getAllPostsUseCase = new GetAllBlogPostsUseCase(blogPostRepository);
        const posts = await getAllPostsUseCase.execute();
        return { posts: JSON.parse(JSON.stringify(posts)) };
    } catch (error) {
        console.error('Error fetching all blog posts:', error);
        return { error: 'No se pudieron obtener las entradas del blog.' };
    }
}

export async function getPublishedBlogPosts(): Promise<{ posts: BlogPost[], error?: string }> {
    try {
        const blogPostRepository = new FirestoreBlogPostRepository();
        const getAllPostsUseCase = new GetAllBlogPostsUseCase(blogPostRepository);
        const posts = await getAllPostsUseCase.execute(true);
        return { posts: JSON.parse(JSON.stringify(posts)) };
    } catch (error) {
        console.error('Error fetching published blog posts:', error);
        return { posts: [] };
    }
}


export async function getBlogPostBySlug(slug: string): Promise<{ post: BlogPost | null, error?: string }> {
     try {
        const blogPostRepository = new FirestoreBlogPostRepository();
        const getPostUseCase = new GetBlogPostUseCase(blogPostRepository);
        const post = await getPostUseCase.executeBySlug(slug);
        return { post: post ? JSON.parse(JSON.stringify(post)) : null };
    } catch (error) {
        console.error('Error fetching post by slug:', error);
        return { post: null };
    }
}


export async function getBlogPostByIdAction(id: string) {
    try {
        const blogPostRepository = new FirestoreBlogPostRepository();
        const getPostUseCase = new GetBlogPostUseCase(blogPostRepository);
        const post = await getPostUseCase.executeById(id);
        if (!post) return { error: 'No se encontró la entrada.' };
        return { post: JSON.parse(JSON.stringify(post)) };
    } catch (error) {
        console.error('Error fetching post by ID:', error);
        return { error: 'No se pudo obtener la entrada.' };
    }
}


export async function updateBlogPostAction(id: string, data: Partial<BlogPost>) {
    try {
        await verifyAuthFromCookie(); // Secure the action
        
        const blogPostRepository = new FirestoreBlogPostRepository();
        const updateUseCase = new UpdateBlogPostUseCase(blogPostRepository);
        await updateUseCase.execute(id, data);

        revalidatePath('/dashboard/admin/blog');
        if (data.slug) {
            revalidatePath(`/blog/${data.slug}`);
        }
        revalidatePath(`/blog/preview/${id}`);
        return { success: true };
    } catch (error) {
        console.error('Error updating post:', error);
        const message = error instanceof Error ? error.message : 'No se pudo actualizar la entrada.';
        return { error: message };
    }
}


export async function updateBlogPostStatusAction(id: string, status: 'Published' | 'Draft' | 'In Review' | 'Archived') {
    return updateBlogPostAction(id, { status });
}

export async function deleteBlogPostAction(id: string) {
    try {
        await verifyAuthFromCookie(); // Secure the action

        const blogPostRepository = new FirestoreBlogPostRepository();
        const deleteUseCase = new DeleteBlogPostUseCase(blogPostRepository);
        await deleteUseCase.execute(id);

        revalidatePath('/dashboard/admin/blog');
        revalidatePath('/blog');
        return { success: true };
    } catch (error) {
        console.error('Error deleting post:', error);
        const message = error instanceof Error ? error.message : 'No se pudo eliminar la entrada.';
        return { error: message };
    }
}
