
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { adminAuth, adminDb } from '@/lib/firebase/admin-config';
import type { UserRole } from '@/lib/user/domain/user.entity';
import { CreateUserProfileUseCase } from '@/lib/user/application/create-user-profile.use-case';
import { FirestoreUserRepository } from '@/lib/user/infrastructure/persistence/firestore-user.repository';

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/google/callback`;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

async function getOrCreateFirebaseUser(googleUser: any, role: UserRole) {
    if (!adminAuth || !adminDb) {
        throw new Error('Firebase Admin not initialized');
    }

    const userRepository = new FirestoreUserRepository();
    const { id, email, name, picture } = googleUser;

    try {
        // User already exists, just return it
        const existingUser = await adminAuth.getUserByEmail(email);
        return existingUser;
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            // User does not exist, create them
            const newUser = await adminAuth.createUser({
                uid: id, // Use Google's ID as UID for consistency
                email: email,
                emailVerified: true,
                displayName: name,
                photoURL: picture,
                disabled: false,
            });

            // Create profile in Firestore
            const createUserCase = new CreateUserProfileUseCase(userRepository);
            await createUserCase.execute({
                uid: newUser.uid,
                name: name,
                email: email,
                role: role,
            });

            return newUser;
        }
        throw error;
    }
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Expecting format: "flow:role"

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  const [flow, role] = state.split(':');
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Differentiate flow based on state
    if (flow === 'auth') {
        // --- Handle User Authentication Flow ---
        const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
        const { data: googleUser } = await oauth2.userinfo.get();
        
        const firebaseUser = await getOrCreateFirebaseUser(googleUser, role as UserRole);

        // Generate a custom token for the client to sign in
        const customToken = await adminAuth.createCustomToken(firebaseUser.uid);

        const redirectUrl = new URL('/dashboard', request.url);
        redirectUrl.searchParams.set('customToken', customToken);

        return NextResponse.redirect(redirectUrl);

    } else if (flow === 'gcal') {
        // --- Handle Google Calendar Connection Flow ---
        const uid = role; // In this case, 'role' is the UID
        if (tokens.access_token) {
            await adminDb.collection('users').doc(uid).update({
                'businessProfile.googleCalendarConnected': true,
                'gcalTokens': tokens,
            });
        }
        const redirectUrl = new URL('/dashboard/advertiser/agent', request.url);
        redirectUrl.searchParams.set('gcal-status', 'success');
        return NextResponse.redirect(redirectUrl);
    }
    
    return NextResponse.json({ error: 'Invalid flow specified in state' }, { status: 400 });

  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    const redirectUrl = new URL('/login', request.url);
    const errorMessage = error instanceof Error ? error.message : 'Unknown OAuth error';
    redirectUrl.searchParams.set('error', errorMessage);
    return NextResponse.redirect(redirectUrl);
  }
}
