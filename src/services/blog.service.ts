
import { FieldValue } from "firebase-admin/firestore";
import type { BlogPost } from "@/lib/types";
import { getAdminServices } from "@/lib/firebase/admin-config";

// This type uses a subset of the full BlogPost type for creation
type BlogPostData = Omit<BlogPost, 'id' | 'author' | 'authorId' | 'date'>;

const db = getAdminServices().db;
const postsCollection = db.collection("posts");

/**
 * Creates a new blog post document in the 'posts' collection in Firestore.
 * This function is called from a secure, server-side context (API Route).
 * @param postData - The data for the blog post to be created.
 * @param authorId - The UID of the authenticated admin user.
 * @param authorName - The name of the admin user.
 * @returns The ID of the newly created blog post document.
 */
export async function createBlogPost(postData: BlogPostData, authorId: string, authorName: string): Promise<string> {
  try {
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

/**
 * Retrieves all blog posts from Firestore, ordered by creation date.
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
    const snapshot = await postsCollection.orderBy('createdAt', 'desc').get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
}

/**
 * Retrieves all published blog posts from Firestore.
 */
export async function getPublishedBlogPosts(): Promise<{ posts: BlogPost[], error?: null }> {
    const snapshot = await postsCollection.where('status', '==', 'Published').orderBy('date', 'desc').get();
    if (snapshot.empty) {
        return { posts: [] };
    }
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
    return { posts };
}

/**
 * Retrieves a single blog post by its slug.
 */
export async function getBlogPostBySlug(slug: string): Promise<{ post: BlogPost | null, error?: null }> {
    const snapshot = await postsCollection.where('slug', '==', slug).limit(1).get();
    if (snapshot.empty) {
        return { post: null };
    }
    const post = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as BlogPost;
    return { post };
}

/**
 * Retrieves a single blog post by its ID.
 */
export async function getBlogPostById(id: string): Promise<{ post: BlogPost | null, error?: null }> {
    const docSnap = await postsCollection.doc(id).get();
    if (!docSnap.exists) {
        return { post: null };
    }
    return { post: { id: docSnap.id, ...docSnap.data() } as BlogPost };
}

/**
 * Updates a blog post document.
 */
export async function updateBlogPost(id: string, data: Partial<BlogPost>): Promise<void> {
    await postsCollection.doc(id).update({
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
    });
}

/**
 * Deletes a blog post document.
 */
export async function deleteBlogPost(id: string): Promise<void> {
    await postsCollection.doc(id).delete();
}
