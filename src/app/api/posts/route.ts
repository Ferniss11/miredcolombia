
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
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
    // Re-run initialization check inside the request to catch environment variable issues per-request
    initializeAdminApp();

    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    const decodedToken = await getAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Get the Firestore instance from the admin SDK
    const adminDb = getFirestore();
    
    // Pass the adminDb instance to the service function
    const userProfile = await getUserProfile(uid, adminDb);

    if (!userProfile || userProfile.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden: User is not an admin' }, { status: 403 });
    }

    const postData = await request.json();

    // Pass the adminDb instance to the service function
    const postId = await createBlogPost(postData, uid, userProfile.name || 'Admin', adminDb);
    
    return NextResponse.json({ success: true, postId }, { status: 201 });

  } catch (error) {
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    // Log the detailed error on the server
    console.error('API Error creating post:', errorMessage);

    if (errorMessage.includes('auth/id-token-expired') || errorMessage.includes('token-expired')) {
        return NextResponse.json({ error: 'Token expired, please log in again.' }, { status: 401 });
    }
    
    // Return the specific error message to the client
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}
