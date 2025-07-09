
'use server';

import { z } from 'zod';
import { createBlogPost } from '@/services/blog.service';
import type { IntelligentArticle } from '@/lib/types';
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
 * Creates a new blog post in the database.
 * This is a server action called from the client.
 */
export async function createBlogPostAction(input: CreateBlogPostInput) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No estás autenticado.');
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
      author: currentUser.displayName || 'Admin', // Or get from user profile
      date: new Date().toISOString(), // Use ISO 8601 format
    };

    const postId = await createBlogPost(newPostData);

    return { success: true, postId };
  } catch (error) {
    console.error('Error creating blog post:', error);
    const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió.';
    return {
      success: false,
      error: `No se pudo crear la entrada de blog: ${errorMessage}`,
    };
  }
}
