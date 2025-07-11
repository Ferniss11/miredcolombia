
'use server';

import { z } from 'zod';
import { getAuth } from "firebase/auth";
import { auth } from '@/lib/firebase/config';

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
export async function createBlogPostAction(input: CreateBlogPostInput) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No estás autenticado. Por favor, inicia sesión de nuevo.');
    }

    // Get the user's ID token to send to the secure API route
    const idToken = await user.getIdToken();

    // Generate a slug from the title
    const slug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // remove special characters
      .replace(/\s+/g, '-') // replace spaces with hyphens
      .replace(/-+/g, '-'); // remove consecutive hyphens
      
    const postDataWithSlug = {
        ...input,
        slug
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/posts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(postDataWithSlug),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || `Error en el servidor: ${response.status}`);
    }

    return { success: true, postId: result.postId };
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
