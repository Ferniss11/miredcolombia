
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebase/admin-config';
import { createBlogPost } from '@/services/blog.service';
import { getUserProfile } from '@/services/user.service';

export async function POST(request: Request) {
  try {
    const adminApp = getAdminApp();
    const adminAuth = getAuth(adminApp);
    const adminDb = getFirestore(adminApp);
    
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    const userProfile = await getUserProfile(uid, adminDb);

    if (!userProfile || userProfile.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden: User is not an admin' }, { status: 403 });
    }

    const postData = await request.json();

    const postId = await createBlogPost(postData, uid, userProfile.name || 'Admin', adminDb);
    
    return NextResponse.json({ success: true, postId }, { status: 201 });

  } catch (error) {
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    console.error('API Error creating post:', errorMessage);

    if (errorMessage.includes('auth/id-token-expired') || errorMessage.includes('token-expired')) {
        return NextResponse.json({ error: 'Token expired, please log in again.' }, { status: 401 });
    }
    
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}
