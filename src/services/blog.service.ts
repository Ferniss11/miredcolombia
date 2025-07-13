
import { FieldValue } from "firebase-admin/firestore";
import type { BlogPost } from "@/lib/types";
import { getAdminServices } from "@/lib/firebase/admin-config";

// This type uses a subset of the full BlogPost type for creation
type BlogPostData = Omit<BlogPost, 'id' | 'author' | 'authorId' | 'date' | 'content' | 'excerpt' | 'imageUrl'>;

/**
 * Creates a new blog post document in the 'posts' collection in Firestore.
 * This function is called from a secure, server-side context (API Route).
 * @param postData - The data for the blog post to be created.
 * @param authorId - The UID of the authenticated admin user.
 * @param authorName - The name of the admin user.
 * @returns The ID of the newly created blog post document.
 */
export async function createBlogPost(postData: BlogPostData, authorId: string, authorName: string): Promise<string> {
  const { db: adminDb } = getAdminServices(); // Get the admin db instance
  
  try {
    const postsCollection = adminDb.collection("posts");
    const docRef = await postsCollection.add({
      ...postData,
      authorId: authorId,
      author: authorName,
      date: new Date().toISOString(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating blog post in Firestore:", error);
    if (error instanceof Error) {
        throw new Error(`Firebase error while creating blog post: ${error.message}`);
    }
    throw new Error('An unknown error occurred while creating the blog post in Firebase.');
  }
}
