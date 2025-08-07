
'use server';

import { google } from 'googleapis';
import { adminDb } from '@/lib/firebase/admin-config';
import type { GoogleTokens } from './types';

// Ensure the redirect URI is consistent and points to the deployed endpoint.
// It's crucial that this exact URI is listed in the "Authorized redirect URIs"
// for your OAuth 2.0 Client ID in the Google Cloud Console.
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/google/callback`;

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

export async function getGoogleAuthUrlAction(uid: string) {
    try {
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline', // Important to get a refresh token
            scope: SCOPES,
            state: uid, // Pass the user's UID to identify them in the callback
            prompt: 'consent', // Force consent screen to ensure refresh token is issued
        });
        return { authUrl };
    } catch (error) {
        console.error("Error generating Google Auth URL:", error);
        return { error: "No se pudo generar la URL de autenticación." };
    }
}


export async function getGoogleAuthClientForUser(uid: string) {
    if (!adminDb) {
        throw new Error('Firebase Admin SDK no está inicializado.');
    }
    const userRef = adminDb.collection('users').doc(uid);
    const docSnap = await userRef.get();

    if (!docSnap.exists) {
        throw new Error('Usuario no encontrado.');
    }

    const userData = docSnap.data();
    const tokens = userData?.gcalTokens as GoogleTokens | undefined;

    if (!tokens) {
        throw new Error('El usuario no ha conectado su cuenta de Google Calendar.');
    }

    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        REDIRECT_URI
    );

    client.setCredentials(tokens);

    // Handle token refresh if necessary
    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
        console.log(`Refrescando token para el usuario ${uid}`);
        const { credentials } = await client.refreshAccessToken();
        client.setCredentials(credentials);
        // Persist the new tokens
        await userRef.update({ 'gcalTokens': credentials });
    }

    return client;
}
