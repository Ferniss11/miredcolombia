// infrastructure/auth/firebase-auth.adapter.ts
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  type AuthError
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config"; // Client SDK
import type { AuthRepository, AuthResult } from '../../domain/auth.repository';
import type { UserRole } from '../../domain/user.entity';

export class FirebaseAuthAdapter implements AuthRepository {
  
  async signInWithGoogle(): Promise<AuthResult> {
    if (!auth || !db) {
      throw new Error('Firebase client SDK not initialized.');
    }
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      return { 
        uid: user.uid, 
        isNewUser: !docSnap.exists(),
        name: user.displayName,
        email: user.email,
      };

    } catch (error) {
      // Handle or re-throw specific auth errors
      throw error;
    }
  }

  async signInWithEmail(email: string, password: string): Promise<string> {
    if (!auth) {
      throw new Error('Firebase client SDK not initialized.');
    }
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user.uid;
  }

  async signUpWithEmail(name: string, email: string, password: string, role: UserRole): Promise<string> {
    if (!auth) {
      throw new Error('Firebase client SDK not initialized.');
    }
    // This method handles auth creation. The corresponding user profile creation
    // will be handled by the CreateUserProfileUseCase, which is called
    // right after this method in the sign-up flow.
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user.uid;
  }

  async signOut(): Promise<void> {
    if (!auth) {
      throw new Error('Firebase client SDK not initialized.');
    }
    await signOut(auth);
  }
}
