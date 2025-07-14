import 'dotenv/config';
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { setAdminApiInitialized } from './config';

/**
 * Initializes the Firebase Admin SDK if not already initialized.
 * This function is designed to be robust for various environments.
 * @returns An object with the instances of Firestore (db) and Auth (auth), or nulls if initialization fails.
 */
function getAdminServices() {
  if (getApps().length > 0) {
    setAdminApiInitialized(true);
    const app = admin.app();
    return {
      db: app.firestore(),
      auth: app.auth(),
      admin: admin
    };
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Firebase Admin environment variables are not fully set.');
    }
      
    const serviceAccount = {
        projectId,
        clientEmail,
        privateKey,
    };

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    setAdminApiInitialized(true);
    return {
      db: app.firestore(),
      auth: app.auth(),
      admin: admin
    };

  } catch (error) {
    // For production environments (like Vercel), we want to fail fast if the keys are missing.
    if (process.env.NODE_ENV === 'production') {
        console.error("CRITICAL: Failed to initialize Firebase Admin SDK in production:", error);
        throw error;
    }
    
    // For local development, we warn but don't crash the entire application.
    console.warn("ADVERTENCIA: Las variables de entorno del Firebase Admin SDK no están configuradas. Las funciones del lado del servidor que dependen de Firebase Admin fallarán. Esto es normal para el desarrollo local si no se necesita acceso de administrador.");
    
    setAdminApiInitialized(false);
    // Return nulls so the app doesn't crash on startup
    return { db: null, auth: null, admin: null };
  }
}

export { getAdminServices };