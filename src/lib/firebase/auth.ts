import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  type AuthError
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./config";
import { createUserProfile } from "@/services/user.service";
import type { UserRole } from "../types";

export async function signUpWithEmail(name: string, email: string, password: string, role: UserRole) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await createUserProfile(user, name, role);
    return { user, error: null };
  } catch (error) {
    return { user: null, error: error as AuthError };
  }
}

export async function signInWithEmail(email: string, password: string) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user, error: null };
    } catch (error) {
        return { user: null, error: error as AuthError };
    }
}

export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);

        if (!docSnap.exists()) {
             await createUserProfile(user, user.displayName || 'Usuario de Google', 'User');
        }

        return { user, error: null };
    } catch (error) {
        return { user: null, error: error as AuthError };
    }
}


export async function signOutUser() {
    try {
        await signOut(auth);
        return { error: null };
    } catch (error) {
        return { error: error as AuthError };
    }
}
