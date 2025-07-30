

import { config } from 'dotenv';
config(); 

import admin from 'firebase-admin';

let initializedProjectId = 'Not initialized';

function initializeFirebaseAdmin() {
  // Check if the default app is already initialized to prevent duplicates.
  if (admin.apps.length > 0) {
    const defaultApp = admin.apps[0];
    if (defaultApp) {
        initializedProjectId = `Re-accessed default app. Project ID: ${defaultApp.options.projectId || 'N/A'}`;
        return {
            db: admin.firestore(),
            auth: admin.auth(),
            storage: admin.storage(),
            admin: admin,
        };
    }
  }

  try {
    // --- Prioritize Base64 encoded service account for Vercel/production ---
    const base64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (base64ServiceAccount) {
      let serviceAccount;
      try {
        const serviceAccountJson = Buffer.from(base64ServiceAccount, 'base64').toString('utf8');
        serviceAccount = JSON.parse(serviceAccountJson);
      } catch (e) {
        throw new Error("Failed to decode or parse FIREBASE_SERVICE_ACCOUNT_BASE64.");
      }

      admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });

      initializedProjectId = `Initialized from Base64. Project ID: ${serviceAccount.project_id}`;
      return {
          db: admin.firestore(),
          auth: admin.auth(),
          storage: admin.storage(),
          admin: admin,
      };
    }
    
    // --- Fallback to individual keys for local development ---
    console.warn("Using fallback local .env variables for Firebase Admin. For production, set FIREBASE_SERVICE_ACCOUNT_BASE64.");
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        const missingKeys = [!projectId && 'FIREBASE_PROJECT_ID', !clientEmail && 'FIREBASE_CLIENT_EMAIL', !privateKey && 'FIREBASE_PRIVATE_KEY'].filter(Boolean).join(', ');
        throw new Error(`CRITICAL: Missing Firebase Admin environment variables: ${missingKeys}`);
    }

    admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
    
    initializedProjectId = `Initialized from local vars. Project ID: ${projectId}`;
    return {
      db: admin.firestore(),
      auth: admin.auth(),
      storage: admin.storage(),
      admin: admin,
    };

  } catch (error: any) {
    let errorMessage = `Initialization failed: ${error.message}`;
    if (error.code === 'auth/invalid-credential' || error.message.includes('DECODER')) {
        errorMessage = `Initialization failed: Invalid credential. Check your Firebase Admin env vars. Error: ${error.message}`;
    }
    console.error("CRITICAL FIREBASE ADMIN INITIALIZATION ERROR:", errorMessage);
    initializedProjectId = errorMessage;
    // Return nulls so the app can potentially run in a degraded state
    return {
      db: null,
      auth: null,
      storage: null,
      admin: null,
    };
  }
}

// Run the initialization and export the results.
const { db: adminDb, auth: adminAuth, storage: adminStorage, admin: adminInstance } = initializeFirebaseAdmin();

export { adminDb, adminAuth, adminStorage, adminInstance, initializedProjectId };
