
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// This is a simplified version of the full BlogPost type
type BlogPostData = {
  slug: string;
  title: string;
  category: string;
  status: 'Published' | 'Draft';
  // ... other fields from the AI model
};

/**
 * Creates a new blog post document in the 'posts' collection in Firestore.
 * This function is now called from a secure, server-side context (API Route).
 * @param postData - The data for the blog post to be created.
 * @param authorId - The UID of the authenticated admin user.
 * @param authorName - The name of the admin user.
 * @returns The ID of the newly created blog post document.
 */
export async function createBlogPost(postData: BlogPostData, authorId: string, authorName: string): Promise<string> {
  if (!db) {
    throw new Error("La base de datos de Firebase no está inicializada.");
  }
  
  try {
    const postsCollection = collection(db, "posts");
    const docRef = await addDoc(postsCollection, {
      ...postData,
      authorId: authorId,
      author: authorName,
      date: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating blog post in Firestore:", error);
    if (error instanceof Error) {
        throw new Error(`Error de Firebase al crear la entrada de blog: ${error.message}`);
    }
    throw new Error('Un error desconocido ocurrió al crear la entrada de blog en Firebase.');
  }
}
