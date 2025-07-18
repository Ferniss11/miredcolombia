
import { adminDb, adminInstance } from "@/lib/firebase/admin-config";
import type { BlogPost } from "@/lib/types";
import { calculateCost } from "@/lib/ai-costs"; // Import the cost calculator

const FieldValue = adminInstance?.firestore.FieldValue;

// This type uses a subset of the full BlogPost type for creation
type BlogPostData = Omit<BlogPost, 'id' | 'author' | 'authorId' | 'date' | 'createdAt' | 'updatedAt'>;

/**
 * Creates a new blog post document in the 'posts' collection in Firestore.
 * This function is called from a secure, server-side context (API Route).
 * @param postData - The data for the blog post to be created.
 * @param authorId - The UID of the authenticated admin user.
 * @param authorName - The name of the admin user.
 * @returns The ID of the newly created blog post document.
 */
export async function createBlogPost(postData: BlogPostData, authorId: string, authorName: string): Promise<string> {
  if (!adminDb || !FieldValue) {
      throw new Error("Firebase Admin SDK is not initialized. Cannot create blog post.");
  }
  try {
    // Note: The cost calculation now happens within the content generation flow,
    // and the cost is passed in the postData. We just save it here.
    const docRef = await adminDb.collection("posts").add({
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
 * Converts Firestore Timestamps in a post object to ISO strings.
 * @param doc - The Firestore document snapshot.
 * @returns The post object with dates serialized as strings.
 */
function serializePost(doc: FirebaseFirestore.DocumentSnapshot): BlogPost {
    const data = doc.data()!;
    const post: any = { id: doc.id, ...data };

    // Convert Timestamps to ISO strings
    for (const key in post) {
        if (post[key] && typeof post[key].toDate === 'function') {
            post[key] = post[key].toDate().toISOString();
        }
    }

    return post as BlogPost;
}


/**
 * Retrieves all blog posts from Firestore, ordered by creation date.
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
    if (!adminDb) {
      console.warn("Firebase Admin SDK not initialized. Skipping getBlogPosts.");
      return [];
    }
    const snapshot = await adminDb.collection("posts").orderBy('createdAt', 'desc').get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(serializePost);
}

/**
 * Retrieves all published blog posts from Firestore.
 */
export async function getPublishedBlogPosts(): Promise<{ posts: BlogPost[], error?: null }> {
    if (!adminDb) {
      console.warn("Firebase Admin SDK not initialized. Skipping getPublishedBlogPosts.");
      return { posts: [] };
    }
    const snapshot = await adminDb.collection("posts").where('status', '==', 'Published').orderBy('date', 'desc').get();
    if (snapshot.empty) {
        return { posts: [] };
    }
    const posts = snapshot.docs.map(serializePost);
    return { posts };
}

/**
 * Retrieves a single blog post by its slug.
 */
export async function getBlogPostBySlug(slug: string): Promise<{ post: BlogPost | null, error?: null }> {
    if (!adminDb) {
      console.warn("Firebase Admin SDK not initialized. Skipping getBlogPostBySlug.");
      return { post: null };
    }
    const snapshot = await adminDb.collection("posts").where('slug', '==', slug).limit(1).get();
    if (snapshot.empty) {
        return { post: null };
    }
    const post = serializePost(snapshot.docs[0]);
    return { post };
}

/**
 * Retrieves a single blog post by its ID.
 */
export async function getBlogPostById(id: string): Promise<{ post: BlogPost | null, error?: null }> {
    if (!adminDb) {
      console.warn("Firebase Admin SDK not initialized. Skipping getBlogPostById.");
      return { post: null };
    }
    const docSnap = await adminDb.collection("posts").doc(id).get();
    if (!docSnap.exists) {
        return { post: null };
    }
    const post = serializePost(docSnap);
    return { post };
}

/**
 * Updates a blog post document.
 */
export async function updateBlogPost(id: string, data: Partial<BlogPost>): Promise<void> {
    if (!adminDb || !FieldValue) {
      throw new Error("Firebase Admin SDK is not initialized. Cannot update blog post.");
    }
    const postRef = adminDb.collection("posts").doc(id);
    await postRef.update({
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
    });
}

/**
 * Deletes a blog post document.
 */
export async function deleteBlogPost(id: string): Promise<void> {
    if (!adminDb) {
      throw new Error("Firebase Admin SDK is not initialized. Cannot delete blog post.");
    }
    await adminDb.collection("posts").doc(id).delete();
}
