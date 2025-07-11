
import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

export function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return;
  }

  if (!serviceAccount) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        'Firebase service account key is not found. Set FIREBASE_SERVICE_ACCOUNT_KEY env variable.'
      );
       throw new Error('Firebase Admin SDK initialization failed: Service Account key is missing.');
    } else {
       console.warn(
        'Firebase service account key not found. Using default credentials for local development. This may not work for all services.'
      );
       admin.initializeApp();
    }
    return;
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
