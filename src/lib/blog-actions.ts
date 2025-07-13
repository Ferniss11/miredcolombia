
'use server';

import { z } from 'zod';
import { createBlogPost, getBlogPosts, getPublishedBlogPosts, getBlogPostBySlug, getBlogPostById, updateBlogPost, deleteBlogPost } from '@/services/blog.service';
import { revalidatePath } from 'next/cache';
import type { BlogPost } from './types';

// Zod schema to validate the incoming blog post data from the client
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
  status: z.enum(['Published', 'Draft']),
});

type CreateBlogPostInput = z.infer<typeof BlogPostActionSchema>;

/**
 * Creates a new blog post by calling a secure API route.
 * This is a server action called from the client.
 */
export async function createBlogPostAction(input: CreateBlogPostInput, idToken: string) {
  try {
    if (!idToken) {
        throw new Error('El token de autenticación es obligatorio.');
    }

    // Generate a slug from the title
    const slug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // remove special characters
      .replace(/\s+/g, '-') // replace spaces with hyphens
      .replace(/-+/g, '-');
      
    const postDataWithSlug = {
        ...input,
        slug
    };

    // Use NEXT_PUBLIC_APP_URL for absolute URL, necessary for server-side fetch
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const response = await fetch(`${appUrl}/api/posts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(postDataWithSlug),
    });

    const result = await response.json();

    if (!response.ok) {
        // The error from the API route's JSON response is now passed here
        throw new Error(result.error || `Error en el servidor: ${response.status}`);
    }
    
    revalidatePath('/dashboard/admin/blog');
    revalidatePath('/blog');

    return { success: true, postId: result.postId };
  } catch (error) {
    console.error('Error detallado en la acción del blog:', error);
    
    let errorMessage = 'Un error desconocido ocurrió.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    return {
      success: false,
      // This errorMessage will now contain the detailed error from the server
      error: `No se pudo crear la entrada de blog: ${errorMessage}`,
    };
  }
}

export async function getBlogPostsAction(): Promise<{ posts?: BlogPost[], error?: string }> {
    try {
        const posts = await getBlogPosts();
        return { posts };
    } catch (error) {
        console.error('Error fetching all blog posts:', error);
        return { error: 'No se pudieron obtener las entradas del blog.' };
    }
}

export { getPublishedBlogPosts, getBlogPostBySlug, getBlogPostById };

export async function updateBlogPostStatusAction(id: string, status: 'Published' | 'Draft' | 'In Review' | 'Archived') {
    try {
        await updateBlogPost(id, { status });
        revalidatePath('/dashboard/admin/blog');
        revalidatePath('/blog');
        revalidatePath(`/blog/[slug]`);
        return { success: true };
    } catch (error) {
        console.error('Error updating post status:', error);
        return { error: 'No se pudo actualizar el estado de la entrada.' };
    }
}

export async function deleteBlogPostAction(id: string) {
    try {
        await deleteBlogPost(id);
        revalidatePath('/dashboard/admin/blog');
        revalidatePath('/blog');
        return { success: true };
    } catch (error) {
        console.error('Error deleting post:', error);
        return { error: 'No se pudo eliminar la entrada.' };
    }
}
