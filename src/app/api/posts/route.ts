
import { NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase/admin-config';
import { createBlogPost } from '@/services/blog.service';
import { getUserProfileByUid } from '@/services/admin.service';

export async function POST(request: Request) {
  try {
    // Step 1: Securely get Admin services. This will throw an error if initialization fails.
    const { auth: adminAuth } = getAdminServices();

    // Step 2: Verify user's authorization token.
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Step 3: Verify user's role from Firestore (using the Admin SDK).
    const userProfile = await getUserProfileByUid(uid);

    if (!userProfile || userProfile.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden: User is not an admin' }, { status: 403 });
    }

    // Step 4: Process the request and create the post.
    const postData = await request.json();

    const postId = await createBlogPost(postData, uid, userProfile.name || 'Admin');
    
    return NextResponse.json({ success: true, postId }, { status: 201 });

  } catch (error) {
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
        // This will now catch the detailed initialization error from getAdminServices
        errorMessage = error.message;
    }
    
    console.error('API Error creating post:', errorMessage);

    if (errorMessage.includes('auth/id-token-expired') || errorMessage.includes('token-expired')) {
        return NextResponse.json({ error: 'Token expired, please log in again.' }, { status: 401 });
    }
    
    // Return the detailed error to the client for debugging.
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}
