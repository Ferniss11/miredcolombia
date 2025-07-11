
'use server';

import { z } from 'zod';
import { createBlogPost } from '@/services/blog.service';

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
 * Creates a new blog post in the database.
 * This is a server action called from the client.
 */
export async function createBlogPostAction(input: CreateBlogPostInput, uid: string, authorName: string) {
  try {
    if (!uid) {
      throw new Error('No estás autenticado. Por favor, inicia sesión de nuevo.');
    }
    
    // Validate the input data against the schema
    const validatedData = BlogPostActionSchema.parse(input);

    // Generate a slug from the title
    const slug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // remove special characters
      .replace(/\s+/g, '-') // replace spaces with hyphens
      .replace(/-+/g, '-'); // remove consecutive hyphens

    const newPostData = {
      ...validatedData,
      slug,
      authorId: uid,
      author: authorName,
      date: new Date().toISOString(), // Use ISO 8601 format
    };

    const postId = await createBlogPost(newPostData);

    return { success: true, postId };
  } catch (error) {
    console.error('Error detallado al crear el post:', error);
    
    let errorMessage = 'Un error desconocido ocurrió.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }

    // Check for specific Firestore permission error
    if (errorMessage.includes('permission-denied') || errorMessage.includes('Missing or insufficient permissions')) {
        return {
            success: false,
            error: 'Error de Permisos de Base de Datos. Asegúrate de que las reglas de seguridad de Firestore permitan la escritura en la colección "posts" para tu usuario.',
        };
    }
    
    return {
      success: false,
      error: `No se pudo crear la entrada de blog: ${errorMessage}`,
    };
  }
}
