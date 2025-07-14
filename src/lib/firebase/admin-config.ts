
import 'dotenv/config'; // Make sure variables from .env are loaded
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// These variables are sensitive and should be stored in environment variables.
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// The private key must have newlines properly escaped in the .env file.
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

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
      admin: admin
    };
  }

  // If no app is initialized, check for necessary credentials.
  const missingKeys = [];
  if (!projectId) missingKeys.push('FIREBASE_PROJECT_ID');
  if (!clientEmail) missingKeys.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) missingKeys.push('FIREBASE_PRIVATE_KEY');
  
  if (missingKeys.length > 0) {
    // For local development, we can warn but not crash the entire application.
    if (process.env.NODE_ENV !== 'production') {
        console.warn(`ADVERTENCIA: Faltan las siguientes variables de entorno de Firebase Admin: ${missingKeys.join(', ')}. Las funciones del lado del servidor que dependen de Firebase Admin fallarán. Esto es normal para el desarrollo local si no se necesita acceso de administrador.`);
        return { db: null, auth: null, admin: null };
    }
    // For production environments, we must fail fast.
    throw new Error(`CRITICAL: Missing Firebase Admin environment variables: ${missingKeys.join(', ')}`);
  }

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
      admin: admin
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`CRITICAL: Firebase Admin initialization failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred during Firebase Admin initialization.');
  }
}

export { getAdminServices };
