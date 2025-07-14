import 'dotenv/config';
import admin from 'firebase-admin';
import { getApps, App } from 'firebase-admin/app';

function initializeAdminApp(): App {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (serviceAccountBase64) {
    try {
      const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(serviceAccountJson);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`CRITICAL: Firebase Admin initialization from Base64 failed: ${error.message}`);
      }
      throw new Error('An unknown error occurred during Firebase Admin initialization from Base64.');
    }
  }

  // Fallback to individual environment variables for local development
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Vercel escapes newlines in private keys, so we need to un-escape them.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
  
  throw new Error('CRITICAL: Missing Firebase Admin environment variables. Set either FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.');
}


/**
 * Initializes the Firebase Admin SDK if not already initialized.
 * This function is designed to be robust for various environments.
 * @returns An object with the instances of Firestore (db) and Auth (auth).
 */
function getAdminServices() {
  if (getApps().length > 0) {
    const app = admin.app();
    return {
      db: app.firestore(),
      auth: app.auth(),
    };
  }
  
  const app = initializeAdminApp();
  
  return {
    db: app.firestore(),
    auth: app.auth(),
  };
}

export { getAdminServices };
