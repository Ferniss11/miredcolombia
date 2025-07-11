
import * as admin from 'firebase-admin';

// Read the separate environment variables for the service account
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

export function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return;
  }
  
  // Check if all required environment variables are present
  if (!projectId || !clientEmail || !privateKey) {
    const missingVars = [
        !projectId && 'FIREBASE_ADMIN_PROJECT_ID',
        !clientEmail && 'FIREBASE_ADMIN_CLIENT_EMAIL',
        !privateKey && 'FIREBASE_ADMIN_PRIVATE_KEY'
    ].filter(Boolean).join(', ');

    const errorMessage = `Firebase Admin SDK cannot be initialized. Missing required environment variables: ${missingVars}.`;
    // Throw the error so it can be caught by the API route and sent to the client.
    throw new Error(errorMessage);
  }
  
  try {
    // Replace literal `\n` characters in the private key with actual newlines
    const parsedPrivateKey = privateKey.replace(/\\n/g, '\n');

    // Assemble the service account object from the environment variables
    const serviceAccount = {
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: parsedPrivateKey,
    };
    
    admin.initializeApp({
      // The credential object is built from the assembled service account
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK with provided credentials.", error);
    // Throw a more specific error
    throw new Error("Failed to initialize Firebase Admin SDK. Make sure the service account variables are correct. Original Error: " + (error instanceof Error ? error.message : "Unknown"));
  }
}
