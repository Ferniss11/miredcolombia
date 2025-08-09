
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { BlogPost } from './types';

// The actions in this file now act as simple, unauthenticated clients for the API routes.
// The authentication and authorization logic is fully handled by the `apiHandler`
// which checks for the user's session cookie.

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
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
        const response = await fetch(`${appUrl}/api/blog`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch posts from API.');
        const posts = await response.json();
        return { posts };
    } catch (error) {
        console.error('Error fetching all blog posts:', error);
        return { error: 'No se pudieron obtener las entradas del blog.' };
    }
}

export async function getPublishedBlogPosts(): Promise<{ posts: BlogPost[], error?: string }> {
    try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
        const response = await fetch(`${appUrl}/api/blog`, { cache: 'no-store' });
         if (!response.ok) throw new Error('Failed to fetch posts from API.');
        const allPosts = await response.json();
        const posts = allPosts.filter((p: BlogPost) => p.status === 'Published');
        return { posts };
    } catch (error) {
        console.error('Error fetching published blog posts:', error);
        return { posts: [] };
    }
}


export async function getBlogPostBySlug(slug: string): Promise<{ post: BlogPost | null, error?: string }> {
     try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
        const response = await fetch(`${appUrl}/api/blog/slug/${slug}`, { cache: 'no-store' });
        if (response.status === 404) return { post: null };
        if (!response.ok) throw new Error('Failed to fetch post from API.');
        const post = await response.json();
        return { post };
    } catch (error) {
        console.error('Error fetching post by slug:', error);
        return { post: null };
    }
}


export async function getBlogPostByIdAction(id: string) {
    try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
        const response = await fetch(`${appUrl}/api/blog/${id}`, { cache: 'no-store' });
        if (response.status === 404) return { error: 'No se encontró la entrada.' };
        if (!response.ok) throw new Error('Failed to fetch post from API.');
        const post = await response.json();
        return { post };
    } catch (error) {
        console.error('Error fetching post by ID:', error);
        return { error: 'No se pudo obtener la entrada.' };
    }
}


export async function updateBlogPostAction(id: string, data: Partial<BlogPost>) {
    try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
        const response = await fetch(`${appUrl}/api/blog/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            cache: 'no-store',
        });
        
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error?.message || 'Failed to update post via API.');
        }

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
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
        const response = await fetch(`${appUrl}/api/blog/${id}`, {
            method: 'DELETE',
            cache: 'no-store',
        });
        
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error?.message || 'Failed to delete post via API.');
        }

        revalidatePath('/dashboard/admin/blog');
        revalidatePath('/blog');
        return { success: true };
    } catch (error) {
        console.error('Error deleting post:', error);
        const message = error instanceof Error ? error.message : 'No se pudo eliminar la entrada.';
        return { error: message };
    }
}
