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

// A new flag to check if the server-side admin SDK is ready
export let adminApiInitialized = false;
export function setAdminApiInitialized(status: boolean) {
    adminApiInitialized = status;
}

// Only initialize if the config is valid
if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain) {
    if (typeof window !== 'undefined') {
        try {
            app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
            auth = getAuth(app);
            db = getFirestore(app);
            firebaseInitialized = true;
        } catch (e) {
            console.error('Failed to initialize Firebase on the client', e);
        }
    }
} else {
    // This warning will show on both server and client if keys are missing
    console.warn("Firebase client config is missing or incomplete. Please check NEXT_PUBLIC_FIREBASE variables in your .env file.");
}

export { app, auth, db, firebaseInitialized };