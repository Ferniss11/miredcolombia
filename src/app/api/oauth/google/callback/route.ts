
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin-config';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_URI
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state parameter' }, { status: 400 });
  }

  // The state should contain the UID of the user who initiated the flow
  const uid = state;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // Store tokens securely in Firestore associated with the user
    if (tokens.access_token && tokens.refresh_token) {
        const userRef = adminDb!.collection('users').doc(uid);
        await userRef.update({
            'businessProfile.googleCalendarConnected': true,
            'gcalTokens': tokens,
        });

    } else {
        throw new Error('Failed to retrieve full set of tokens from Google.');
    }

    // Redirect user back to their profile page
    const redirectUrl = new URL('/dashboard/advertiser/profile', request.url);
    redirectUrl.searchParams.set('gcal-status', 'success');
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Error exchanging authorization code:', error);
    const redirectUrl = new URL('/dashboard/advertiser/profile', request.url);
    redirectUrl.searchParams.set('gcal-status', 'error');
    return NextResponse.redirect(redirectUrl);
  }
}
