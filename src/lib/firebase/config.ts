
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

function initializeAppClient(): FirebaseApp {
    if (getApps().length === 0) {
        if (!firebaseConfig.projectId) {
            throw new Error("Missing Firebase config variables");
        }
        return initializeApp(firebaseConfig);
    } else {
        return getApp();
    }
}

const app: FirebaseApp = initializeAppClient();
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);


// A function is still useful for parts of the app that might expect it,
// but direct exports are cleaner for server components/actions.
const getFirebaseServices = () => {
    return { app, auth, db };
}


export { getFirebaseServices, app, auth, db };
