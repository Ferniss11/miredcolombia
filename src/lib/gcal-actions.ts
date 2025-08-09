
'use server';

import { google } from 'googleapis';
import { adminDb } from '@/lib/firebase/admin-config';
import type { GoogleTokens } from '../types';

// Ensure the redirect URI is consistent and points to the deployed endpoint.
// It's crucial that this exact URI is listed in the "Authorized redirect URIs"
// for your OAuth 2.0 Client ID in the Google Cloud Console.
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/google/callback`;

// SCOPES for Google Calendar API access
const GCAL_SCOPES = ['https://www.googleapis.com/auth/calendar.events'];


const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

export async function getGoogleAuthUrlAction(uid: string) {
    try {
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline', 
            scope: GCAL_SCOPES,
            // Pass the user's UID in the state to identify them on callback
            state: `gcal:${uid}`, 
            prompt: 'consent',
        });
        return { authUrl };
    } catch (error) {
        console.error("Error generating Google Auth URL for GCal:", error);
        return { error: "No se pudo generar la URL de autorización." };
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
    // Tokens are now stored under businessProfile
    const tokens = userData?.businessProfile?.gcalTokens as GoogleTokens | undefined;

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
        // Persist the new tokens in the correct location
        await userRef.update({ 'businessProfile.gcalTokens': credentials });
    }

    return client;
}
