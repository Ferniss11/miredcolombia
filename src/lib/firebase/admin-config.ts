
import * as admin from 'firebase-admin';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

export function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return;
  }
  
  if (!serviceAccountKey) {
    const errorMessage = 'Firebase service account key is not found in environment variables (FIREBASE_SERVICE_ACCOUNT_KEY). The Admin SDK cannot be initialized.';
    // Throw the error so it can be caught by the API route and sent to the client.
    throw new Error(errorMessage);
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
    // Throw a more specific error
    throw new Error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY or initialize Firebase Admin SDK. Make sure the service account key is a valid JSON. Original Error: " + (error instanceof Error ? error.message : "Unknown"));
  }
}
