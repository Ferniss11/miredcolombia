
import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';

function getAdminApp(): App {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Make sure to replace \\n with \n in the private key.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    const missingVars = [
        !projectId && 'FIREBASE_ADMIN_PROJECT_ID',
        !clientEmail && 'FIREBASE_ADMIN_CLIENT_EMAIL',
        !privateKey && 'FIREBASE_ADMIN_PRIVATE_KEY'
    ].filter(Boolean).join(', ');
    throw new Error(`Firebase Admin SDK cannot be initialized. Missing required environment variables: ${missingVars}.`);
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey,
      }),
    });
  } catch (error) {
     if (error instanceof Error) {
        throw new Error("Failed to initialize Firebase Admin SDK. Make sure the service account variables are correct. Original Error: " + error.message);
     }
     throw new Error("An unknown error occurred during Firebase Admin SDK initialization.");
  }
}

export { getAdminApp };
