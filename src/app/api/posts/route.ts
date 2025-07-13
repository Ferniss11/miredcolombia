
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin-config';
import { createBlogPost } from '@/services/blog.service';
import { getUserProfileByUid } from '@/services/admin.service';

export async function POST(request: Request) {
  try {
    if (!adminAuth || !adminDb) {
      throw new Error("El SDK de Firebase Admin no se ha inicializado correctamente. Revisa los logs del servidor.");
    }

    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Use the dedicated admin service to get the user profile
    const userProfile = await getUserProfileByUid(uid);

    if (!userProfile || userProfile.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden: User is not an admin' }, { status: 403 });
    }

    const postData = await request.json();

    const postId = await createBlogPost(postData, uid, userProfile.name || 'Admin');
    
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
