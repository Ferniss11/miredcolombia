
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
import type { UserRole } from "../types";

// This is not a server action, but a client-side utility
// that interacts with the client-side Firebase SDK.

/**
 * Creates a user profile in Firestore if it doesn't exist.
 * This function is intended to be called from the client after a successful
 * authentication, especially for social logins where the profile might not exist.
 * @param user - The Firebase Auth user object.
 * @param name - The user's display name.
 * @param role - The role to assign to the user.
 */
async function ensureUserProfileExists(user: import("firebase/auth").User, name: string, role: UserRole): Promise<void> {
  if (!db) throw new Error("Firebase client database is not initialized.");
  const userRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          name: name,
          email: user.email,
          role: role,
        }),
      });

      if (!response.ok) {
        const apiError = await response.json();
        throw new Error(apiError.error?.message || 'Server error creating profile.');
      }
    } catch (error) {
      console.error("Failed to create user profile via API:", error);
      // We might want to sign the user out here or handle the error more gracefully.
      throw error;
    }
  }
}


export async function signUpWithEmail(name: string, email: string, password: string, role: UserRole) {
  if (!auth) {
    return { user: null, error: { code: 'auth/unavailable', message: 'Firebase Auth is not initialized.' } as AuthError };
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Profile creation is now handled by the API call in the component
    return { user, error: null };
  } catch (error) {
    return { user: null, error: error as AuthError };
  }
}

export async function signInWithEmail(email: string, password: string) {
    if (!auth) {
      return { user: null, error: { code: 'auth/unavailable', message: 'Firebase Auth is not initialized.' } as AuthError };
    }
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user, error: null };
    } catch (error) {
        return { user: null, error: error as AuthError };
    }
}

export async function signInWithGoogle(role: UserRole = 'User') {
    if (!auth) {
      return { user: null, error: { code: 'auth/unavailable', message: 'Firebase Auth is not initialized.' } as AuthError };
    }
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // After Google sign-in, ensure a profile exists in our DB via the API
        await ensureUserProfileExists(user, user.displayName || 'Usuario de Google', role);

        return { user, error: null };
    } catch (error) {
        return { user: null, error: error as AuthError };
    }
}


export async function signOutUser() {
    if (!auth) {
      return { error: { code: 'auth/unavailable', message: 'Firebase Auth is not initialized.' } as AuthError };
    }
    try {
        await signOut(auth);
        return { error: null };
    } catch (error) {
        return { error: error as AuthError };
    }
}
