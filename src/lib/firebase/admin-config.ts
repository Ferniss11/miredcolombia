import 'dotenv/config'; // Make sure variables from .env are loaded
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// These variables are sensitive and should be stored in environment variables.
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
// The private key must have newlines properly escaped in the .env file.
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

/**
 * Initializes the Firebase Admin SDK if not already initialized.
 * This function is designed to be robust for serverless environments like Next.js.
 * Throws a detailed error if initialization fails.
 * @returns An object with the instances of Firestore (db) and Auth (auth).
 */
function getAdminServices() {
  // If the app is already initialized, return its services.
  if (getApps().length > 0) {
    const app = admin.app();
    return {
      db: app.firestore(),
      auth: app.auth(),
    };
  }

  // If no app is initialized, check for necessary credentials.
  const missingKeys = [];
  if (!projectId) missingKeys.push('FIREBASE_ADMIN_PROJECT_ID');
  if (!clientEmail) missingKeys.push('FIREBASE_ADMIN_CLIENT_EMAIL');
  if (!privateKey) missingKeys.push('FIREBASE_ADMIN_PRIVATE_KEY');
  
  if (missingKeys.length > 0) {
    throw new Error(`CRITICAL: Missing Firebase Admin environment variables: ${missingKeys.join(', ')}`);
  }

  // Create and initialize a new app.
  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    return {
      db: app.firestore(),
      auth: app.auth(),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`CRITICAL: Firebase Admin initialization failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred during Firebase Admin initialization.');
  }
}

// Export a single function to get the services. This ensures the initialization logic
// is run only when the services are first requested.
export { getAdminServices };
