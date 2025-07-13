import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';

const ADMIN_APP_NAME = 'colombia-en-espana-admin';

let adminDb: admin.firestore.Firestore | null = null;
let adminAuth: admin.auth.Auth | null = null;

try {
  // Try to get an existing app
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

    // The key might be wrapped in quotes if it's a single line in .env
    let cleanedKey = serviceAccountKey;
    if (cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) {
        cleanedKey = cleanedKey.substring(1, cleanedKey.length - 1);
    }
    
    // Replace literal \n with actual newlines
    cleanedKey = cleanedKey.replace(/\\n/g, '\n');

    const serviceAccount = JSON.parse(cleanedKey);

    const newApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id, // Use project_id from the JSON itself
    }, ADMIN_APP_NAME);

    adminDb = newApp.firestore();
    adminAuth = newApp.auth();
  }
} catch (error: any) {
    let errorMessage = `CRITICAL FIREBASE ADMIN INITIALIZATION ERROR: ${error.message}`;
    if (error.code === 'app/duplicate-app') {
        errorMessage = 'Firebase Admin App ya está inicializada. Usando la instancia existente.';
    } else if (error.message.includes('JSON')) {
        errorMessage = 'Error de inicialización: FIREBASE_SERVICE_ACCOUNT_KEY no es un JSON válido. Por favor, comprueba el formato en el archivo .env.';
    }
    console.error(errorMessage);
    // Set to null so subsequent calls will fail explicitly
    adminDb = null;
    adminAuth = null;
}

export { adminDb, adminAuth };
