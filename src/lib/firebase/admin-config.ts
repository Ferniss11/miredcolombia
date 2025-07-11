
import * as admin from 'firebase-admin';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

export function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return;
  }
  
  if (!serviceAccountKey) {
    const errorMessage = 'Firebase service account key is not found in environment variables (FIREBASE_SERVICE_ACCOUNT_KEY). The Admin SDK cannot be initialized.';
    console.error(errorMessage);
    if (process.env.NODE_ENV === 'production') {
       throw new Error(errorMessage);
    }
    console.warn("Continuing without full admin capabilities. API routes requiring admin rights will fail.");
    return;
  }
  
  try {
    // Replace literal `\n` characters with actual newlines
    const parsedServiceAccountKey = serviceAccountKey.replace(/\\n/g, '\n');
    const serviceAccount = JSON.parse(parsedServiceAccountKey);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY or initializing Firebase Admin SDK.", error);
    throw new Error("Failed to initialize Firebase Admin SDK. Make sure the service account key is a valid JSON.");
  }
}
