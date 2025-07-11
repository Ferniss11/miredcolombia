
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeAdminApp } from '@/lib/firebase/admin-config';
import { createBlogPost } from '@/services/blog.service';
import { getUserProfile } from '@/services/user.service';

// Ensure the Firebase Admin app is initialized
try {
  initializeAdminApp();
} catch (error) {
  console.error("Failed to initialize Firebase Admin SDK on API route:", error);
}


export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    const decodedToken = await getAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    const userProfile = await getUserProfile(uid);
    if (!userProfile || userProfile.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden: User is not an admin' }, { status: 403 });
    }

    const postData = await request.json();

    const postId = await createBlogPost(postData, uid, userProfile.name || 'Admin');
    
    return NextResponse.json({ success: true, postId }, { status: 201 });

  } catch (error) {
    console.error('API Error creating post:', error);
    
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    if (errorMessage.includes('auth/id-token-expired') || errorMessage.includes('token-expired')) {
        return NextResponse.json({ error: 'Token expired, please log in again.' }, { status: 401 });
    }
     if (errorMessage.includes('Firebase Admin SDK has not been properly initialized')) {
        return NextResponse.json({ error: 'Server configuration error: Firebase Admin SDK not initialized. Check server logs.' }, { status: 500 });
    }
    
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}
