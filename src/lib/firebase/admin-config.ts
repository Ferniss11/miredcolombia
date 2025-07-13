import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';

const ADMIN_APP_NAME = 'colombia-en-espana-admin';

let adminDb: admin.firestore.Firestore | null = null;
let adminAuth: admin.auth.Auth | null = null;

try {
  // Try to get an existing app to avoid re-initializing
  const existingApp = admin.apps.find(app => app?.name === ADMIN_APP_NAME);
  if (existingApp) {
    adminDb = existingApp.firestore();
    adminAuth = existingApp.auth();
  } else {
    // If it doesn't exist, initialize a new one
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      throw new Error('La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está definida.');
    }

    // Robustly clean and parse the key
    let cleanedKey = serviceAccountKey;

    // Remove quotes that might wrap the entire string in .env
    if (cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) {
        cleanedKey = cleanedKey.substring(1, cleanedKey.length - 1);
    }
    
    // Replace literal \n with actual newlines. Important for the private_key.
    cleanedKey = cleanedKey.replace(/\\n/g, '\n');

    let serviceAccount;
    try {
        serviceAccount = JSON.parse(cleanedKey);
    } catch(e) {
        if (e instanceof Error) {
            throw new Error(`Error al parsear el JSON de FIREBASE_SERVICE_ACCOUNT_KEY: ${e.message}. Asegúrate de que está en formato JSON válido y en una sola línea en el archivo .env.`);
        }
        throw new Error('Error desconocido al parsear el JSON de la clave de servicio.');
    }

    const newApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    }, ADMIN_APP_NAME);

    adminDb = newApp.firestore();
    adminAuth = newApp.auth();
  }
} catch (error: any) {
    console.error(`CRITICAL FIREBASE ADMIN INITIALIZATION ERROR: ${error.message}`);
    // Explicitly set to null so subsequent calls will fail clearly
    adminDb = null;
    adminAuth = null;
}

export { adminDb, adminAuth };
