
import { NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase/admin-config';
import { createBlogPost } from '@/services/blog.service';
import { getUserProfileByUid } from '@/services/admin.service';

export async function POST(request: Request) {
  try {
    // Paso 1: Obtener los servicios de Admin. Esto fallará si la inicialización es incorrecta.
    const { auth: adminAuth, db: adminDb } = getAdminServices();

    // Paso 2: Verificar el token de autorización del usuario.
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Paso 3: Verificar el rol del usuario desde Firestore (usando el SDK de Admin).
    const userProfile = await getUserProfileByUid(uid);

    if (!userProfile || userProfile.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden: User is not an admin' }, { status: 403 });
    }

    // Paso 4: Procesar la solicitud y crear el post.
    const postData = await request.json();

    const postId = await createBlogPost(postData, uid, userProfile.name || 'Admin');
    
    return NextResponse.json({ success: true, postId }, { status: 201 });

  } catch (error) {
    // Si CUALQUIER cosa falla (especialmente la inicialización), capturamos el error.
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
        // Este es el cambio clave: enviamos el mensaje de error DETALLADO al cliente.
        errorMessage = error.message;
    }
    
    console.error('API Error creating post:', errorMessage);

    if (errorMessage.includes('auth/id-token-expired') || errorMessage.includes('token-expired')) {
        return NextResponse.json({ error: 'Token expired, please log in again.' }, { status: 401 });
    }
    
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}
