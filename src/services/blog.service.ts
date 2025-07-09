
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// The data structure here should match what's expected in Firestore.
// It's a combination of IntelligentArticle and BlogPost metadata.
type BlogPostData = {
  slug: string;
  title: string;
  author: string;
  date: string;
  status: 'Published' | 'Draft' | 'In Review' | 'Archived';
  category: string;
  introduction: string;
  conclusion: string;
  sections: Array<{
    heading: string;
    content: string;
    imageUrl?: string;
    imageHint?: string;
  }>;
  featuredImageUrl?: string;
  featuredImageHint?: string;
  suggestedTags: string[];
};

/**
 * Creates a new blog post document in the 'posts' collection in Firestore.
 * @param postData - The data for the blog post to be created.
 * @returns The ID of the newly created blog post document.
 */
export async function createBlogPost(postData: BlogPostData): Promise<string> {
  if (!db) {
    throw new Error("La base de datos de Firebase no está inicializada.");
  }
  
  try {
    const postsCollection = collection(db, "posts");
    const docRef = await addDoc(postsCollection, {
      ...postData,
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
