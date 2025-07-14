
import { config } from 'dotenv';
config(); // Carga las variables de entorno desde .env

import admin from 'firebase-admin';

// This needs to be a unique name for the admin app instance
const ADMIN_APP_NAME = 'ColomboEspanolaAdmin';
let initializedProjectId = 'Not initialized';

function initializeFirebaseAdmin() {
  try {
    // Check if our specific named app is already initialized.
    const existingApp = admin.apps.find(app => app?.name === ADMIN_APP_NAME);
    if (existingApp) {
      initializedProjectId = `Re-accessed named app '${ADMIN_APP_NAME}'. Project ID: ${existingApp.options.projectId || 'N/A'}`;
      return {
        db: existingApp.firestore(),
        auth: existingApp.auth(),
        admin: admin,
      };
    }

    // --- NEW: Prioritize Base64 encoded service account for Vercel/production ---
    const base64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (base64ServiceAccount) {
        const serviceAccountJson = Buffer.from(base64ServiceAccount, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(serviceAccountJson);

        if (typeof serviceAccount.private_key !== 'string') {
             throw new Error('The private_key in the decoded service account is not a string.');
        }

        const app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        }, ADMIN_APP_NAME);

        initializedProjectId = `Initialized from Base64. Project ID: ${app.options.projectId}`;
        return {
            db: app.firestore(),
            auth: app.auth(),
            admin: admin,
        };
    }
    
    // --- Fallback to individual keys for local development ---
    console.warn("Using fallback local .env variables for Firebase Admin. For production, set FIREBASE_SERVICE_ACCOUNT_BASE64.");
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    const hasAllKeys = projectId && clientEmail && privateKey;

    if (!hasAllKeys) {
        const missingKeys = [];
        if (!projectId) missingKeys.push('FIREBASE_PROJECT_ID');
        if (!clientEmail) missingKeys.push('FIREBASE_CLIENT_EMAIL');
        if (!privateKey) missingKeys.push('FIREBASE_PRIVATE_KEY');
        initializedProjectId = `CRITICAL: Missing Firebase Admin environment variables: ${missingKeys.join(', ')}`;
        throw new Error(initializedProjectId);
    }

    const app = admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
        }),
    }, ADMIN_APP_NAME);
    
    initializedProjectId = `Initialized from local vars. Project ID: ${projectId}`;
    return {
      db: app.firestore(),
      auth: app.auth(),
      admin: admin,
    };

  } catch (error: any) {
    let errorMessage = `Initialization failed: ${error.message}`;
    if (error.code === 'app/duplicate-app') {
        errorMessage = `Duplicate Firebase app initialization detected. App name: ${ADMIN_APP_NAME}.`;
    } else if (error.message.includes('JSON')) {
        errorMessage = 'Initialization failed: Service account key is not valid JSON.';
    } else if (error.code === 'auth/invalid-credential' || error.message.includes('DECODER')) {
        errorMessage = `Initialization failed: Invalid credential. Check the content and format of your Firebase Admin environment variables. Error: ${error.message}`;
    }
    console.error("CRITICAL FIREBASE ADMIN INITIALIZATION ERROR:", errorMessage);
    initializedProjectId = errorMessage;
    return {
      db: null,
      auth: null,
      admin: null,
    };
  }
}

// Run the initialization and export the results.
const { db: adminDb, auth: adminAuth, admin: adminInstance } = initializeFirebaseAdmin();

export { adminDb, adminAuth, adminInstance, initializedProjectId };
