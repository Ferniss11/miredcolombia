
import admin from 'firebase-admin';

// This needs to be a unique name for the admin app instance
const ADMIN_APP_NAME = 'ColomboEspanolaAdmin';

function initializeFirebaseAdmin() {
  try {
    // Check if our specific named app is already initialized.
    const existingApp = admin.apps.find(app => app?.name === ADMIN_APP_NAME);
    if (existingApp) {
      try {
        // If it exists, return its services.
        return {
          db: existingApp.firestore(),
          auth: existingApp.auth(),
          admin: admin,
        };
      } catch (e: any) {
         // This might happen if the app exists but services are unavailable.
         console.error(`Failed to get services from existing app '${ADMIN_APP_NAME}': ${e.message}`);
         return {
          db: null,
          auth: null,
          admin: null,
        };
      }
    }
    
    // Fallback to individual keys if the base64 one is not present
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    const hasAllKeys = projectId && clientEmail && privateKey;

    if (!hasAllKeys) {
        if (process.env.NODE_ENV === 'development') {
            console.warn("ADVERTENCIA: Faltan las variables de entorno del Firebase Admin SDK (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY). Las funciones del lado del servidor que dependen de Firebase Admin fallarán. Esto es normal para el desarrollo local si no se necesita acceso de administrador.");
            return { db: null, auth: null, admin: null };
        }
        // In production, we should fail hard if keys are missing
        const missingKeys = [];
        if (!projectId) missingKeys.push('FIREBASE_PROJECT_ID');
        if (!clientEmail) missingKeys.push('FIREBASE_CLIENT_EMAIL');
        if (!privateKey) missingKeys.push('FIREBASE_PRIVATE_KEY');
        throw new Error(`CRITICAL: Missing Firebase Admin environment variables: ${missingKeys.join(', ')}`);
    }

    const app = admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
        }),
    }, ADMIN_APP_NAME);
    
    return {
      db: app.firestore(),
      auth: app.auth(),
      admin: admin,
    };

  } catch (error: any) {
    let errorMessage = `Initialization failed: ${error.message}`;
    if (error.code === 'app/duplicate-app') {
        errorMessage = `Duplicate Firebase app initialization detected. App name: ${ADMIN_APP_NAME}. This should not happen with the current logic.`;
    } else if (error.message.includes('JSON')) {
        errorMessage = 'Initialization failed: Service account key is not valid JSON.';
    }
    console.error("CRITICAL FIREBASE ADMIN INITIALIZATION ERROR:", errorMessage);
    return {
      db: null,
      auth: null,
      admin: null,
    };
  }
}

// Run the initialization and export the results.
const { db: adminDb, auth: adminAuth, admin: adminInstance } = initializeFirebaseAdmin();

export { adminDb, adminAuth, adminInstance };
