
import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

export function initializeAdminApp() {
  if (!serviceAccount) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        'Firebase service account key is not found. Set FIREBASE_SERVICE_ACCOUNT_KEY env variable.'
      );
    } else {
       console.warn(
        'Firebase service account key is not found. Using default credentials for development.'
      );
    }
    if (admin.apps.length === 0) {
       admin.initializeApp();
    }
    return;
  }
  
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}
