
import admin from 'firebase-admin';

// This needs to be a unique name for the admin app instance
const ADMIN_APP_NAME = 'ColomboEspanolaAdmin';
let initializedProjectId = 'Not initialized';

function initializeFirebaseAdmin() {
  try {
    // Check if our specific named app is already initialized.
    const existingApp = admin.apps.find(app => app?.name === ADMIN_APP_NAME);
    if (existingApp) {
      try {
        // If it exists, return its services.
        initializedProjectId = `Re-accessed named app '${ADMIN_APP_NAME}'. Project ID: ${existingApp.options.projectId || 'N/A'}`;
        return {
          db: existingApp.firestore(),
          auth: existingApp.auth(),
          admin: admin,
        };
      } catch (e: any) {
         initializedProjectId = `Failed to get services from existing app '${ADMIN_APP_NAME}': ${e.message}`;
         return { db: null, auth: null, admin: null, };
      }
    }
    
    // Fallback to individual keys if the base64 one is not present
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
    
    initializedProjectId = `Initialized named app '${ADMIN_APP_NAME}'. Project ID: ${projectId}`;
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
