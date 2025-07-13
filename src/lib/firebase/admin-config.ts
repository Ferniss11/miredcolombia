import * as admin from 'firebase-admin';

let adminServices: { db: admin.firestore.Firestore; auth: admin.auth.Auth } | null = null;

/**
 * Initializes the Firebase Admin SDK if not already initialized.
 * This function uses a robust pattern for serverless environments like Next.js.
 * Throws a detailed error if initialization fails.
 * @returns An object with the instances of Firestore (db) and Auth (auth).
 */
export function getAdminServices() {
  if (adminServices) {
    return adminServices;
  }

  // If the app is already initialized, return the existing services.
  if (admin.apps.length > 0) {
    const app = admin.app();
    adminServices = {
      db: app.firestore(),
      auth: app.auth(),
    };
    return adminServices;
  }

  // If no app is initialized, create one.
  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    // The private key must have newlines properly escaped in the .env file.
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      const missingKeys = [];
      if (!projectId) missingKeys.push('FIREBASE_ADMIN_PROJECT_ID');
      if (!clientEmail) missingKeys.push('FIREBASE_ADMIN_CLIENT_EMAIL');
      if (!privateKey) missingKeys.push('FIREBASE_ADMIN_PRIVATE_KEY');
      throw new Error(`CRITICAL: Missing Firebase Admin environment variables: ${missingKeys.join(', ')}`);
    }
    
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    adminServices = {
      db: app.firestore(),
      auth: app.auth(),
    };

    return adminServices;

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`CRITICAL: Firebase Admin initialization failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred during Firebase Admin initialization.');
  }
}
