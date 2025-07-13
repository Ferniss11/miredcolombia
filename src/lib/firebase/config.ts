import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let firebaseInitialized = false;

// Only initialize the client-side Firebase app in the browser
if (typeof window !== 'undefined') {
  if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain) {
    try {
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      auth = getAuth(app);
      db = getFirestore(app);
      firebaseInitialized = true;
    } catch (e) {
       console.error('Failed to initialize Firebase', e);
    }
  } else {
    console.warn("Firebase config is missing or incomplete. Please check NEXT_PUBLIC_FIREBASE variables in your .env file.");
  }
} else if (!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain)) {
    // Also warn on server side if keys are missing, as it might indicate a problem.
    console.warn("Firebase client config is missing or incomplete. This is expected on the server, but check your .env if this message appears in browser logs.");
}

// In the server environment (where window is undefined), app, auth, and db will remain null.
// `firebaseInitialized` will only be true on the client.

export { app, auth, db, firebaseInitialized };
