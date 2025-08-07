
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  linkWithCredential,
  EmailAuthProvider,
  fetchSignInMethodsForEmail,
  type Auth,
  type AuthError,
  type IdTokenResult,
} from 'firebase/auth';
import { getFirebaseServices } from '@/lib/firebase/config';
import type { UserProfile, UserRole } from '@/lib/types';

// --- Helper function to create profile via API ---
async function ensureUserProfileExists(user: User, name: string, role: UserRole): Promise<void> {
  console.log(`[AuthContext] Ensuring profile exists for UID: ${user.uid} with role: ${role}`);
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
    
    if (!response.ok && response.status !== 409) {
      const apiError = await response.json();
      throw new Error(apiError.error?.message || 'Server error creating profile.');
    }
     console.log(`[AuthContext] Profile ensured for UID: ${user.uid}. Status: ${response.status}`);
  } catch (error) {
    console.error("[AuthContext] Failed to create user profile via API:", error);
    throw error;
  }
}

// --- Helper function to GET profile via API ---
async function getUserProfile(uid: string, token: string): Promise<UserProfile | null> {
    if (!uid || !token) return null;
     try {
        const response = await fetch(`/api/users/${uid}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.status === 404) {
            return null;
        }
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to fetch user profile from API.');
        }
        return await response.json();
    } catch (error) {
        console.error("[AuthContext] Error fetching user profile:", error);
        return null;
    }
}


interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  claims: IdTokenResult['claims'] | null;
  refreshUserProfile: () => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string, role: UserRole) => Promise<{ error: string | null }>;
  loginWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  loginWithGoogle: (role: UserRole) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<IdTokenResult['claims'] | null>(null);
  
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);
  const router = useRouter();

  const fetchUserProfile = useCallback(async (firebaseUser: User | null) => {
    if (firebaseUser) {
      try {
        // Force refresh the token to get the latest custom claims.
        const idTokenResult = await firebaseUser.getIdTokenResult(true); 
        setClaims(idTokenResult.claims);
        
        const profile = await getUserProfile(firebaseUser.uid, idTokenResult.token);
        setUserProfile(profile);
        console.log("[AuthContext] Fresh profile and claims fetched.", { profile, claims: idTokenResult.claims });
      } catch (error) {
        console.error("[AuthContext] Error fetching user profile and claims:", error);
        setUserProfile(null);
        setClaims(null);
      }
    } else {
      setUserProfile(null);
      setClaims(null);
    }
  }, []);

  useEffect(() => {
    const { auth } = getFirebaseServices();
    setAuthInstance(auth);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchUserProfile(firebaseUser);
      } else {
        setUser(null);
        setUserProfile(null);
        setClaims(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);


  const refreshUserProfile = useCallback(async () => {
    if (user) {
        setLoading(true);
        await fetchUserProfile(user);
        setLoading(false);
    }
  }, [user, fetchUserProfile]);

  const signUpWithEmail = async (name: string, email: string, password: string, role: UserRole): Promise<{ error: string | null }> => {
    if (!authInstance) return { error: 'Firebase not initialized' };
    try {
        const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
        await ensureUserProfileExists(userCredential.user, name, role);
        await fetchUserProfile(userCredential.user);
        return { error: null };
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            const methods = await fetchSignInMethodsForEmail(authInstance, email);
            if (methods.includes('google.com')) {
                if (confirm("Ya tienes una cuenta con este email a través de Google. ¿Quieres vincular una contraseña a tu cuenta de Google para poder iniciar sesión con ambos métodos?")) {
                    try {
                        const googleProvider = new GoogleAuthProvider();
                        const result = await signInWithPopup(authInstance, googleProvider);
                        const credential = EmailAuthProvider.credential(email, password);
                        await linkWithCredential(result.user, credential);
                        await fetchUserProfile(result.user);
                        return { error: null };
                    } catch (linkError: any) {
                        return { error: `No se pudo vincular la cuenta: ${linkError.message}` };
                    }
                } else {
                    return { error: "Registro cancelado. Por favor, inicia sesión con Google." };
                }
            }
        }
        return { error: (error as AuthError).message };
    }
};

  const loginWithEmail = async (email: string, password: string) => {
    if (!authInstance) return { error: { code: 'auth/unavailable', message: 'Firebase not initialized' } as AuthError };
    try {
        const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
        // Let the onAuthStateChanged listener handle the profile fetching
        return { error: null };
    } catch (error) {
        return { error: error as AuthError };
    }
  };
  
  const loginWithGoogle = async (role: UserRole) => {
    if (!authInstance) return { error: 'Firebase not initialized' };
    console.log(`[Google Auth] Starting login flow with role: ${role}`);

    const provider = new GoogleAuthProvider();
    
    try {
        console.log(`[Google Auth] Calling signInWithPopup...`);
        const result = await signInWithPopup(authInstance, provider);
        const user = result.user;
        console.log(`[Google Auth] signInWithPopup successful. User:`, user);
        
        console.log(`[Google Auth] Checking for existing profile for UID: ${user.uid}`);
        const token = await user.getIdToken();
        const profile = await getUserProfile(user.uid, token);
        
        if (!profile) {
            console.log(`[Google Auth] No profile found. Creating new user profile for ${user.email}`);
            await ensureUserProfileExists(user, user.displayName || 'Usuario de Google', role);
        }
        
        console.log(`[Google Auth] User profile exists or was created. Fetching fresh profile...`);
        await fetchUserProfile(user);
        console.log(`[Google Auth] Flow completed successfully.`);
        
        return { error: undefined };

    } catch (error: any) {
        console.error("Google Sign-In Error:", error.code, error.message);
        if (error.code === 'auth/account-exists-with-different-credential') {
            console.log(`[Google Auth] Account exists with different credential. Starting link flow.`);
            const email = error.customData?.email;
            if (!email) {
                 return { error: "No se pudo obtener el email del proveedor."};
            }
            
            try {
                const password = prompt(`Ya tienes una cuenta con ${email} (registrada con email/contraseña). Por favor, introduce tu contraseña para vincular tu inicio de sesión con Google.`);
                if (!password) {
                    return { error: "Vinculación cancelada. Contraseña no introducida." };
                }

                // First, sign in the user with their existing password to prove ownership.
                const userCredential = await signInWithEmailAndPassword(authInstance, email, password);

                // Then, get the Google credential from the original error.
                const googleCredential = GoogleAuthProvider.credentialFromError(error);
                if (!googleCredential) {
                    return { error: "No se pudo obtener la credencial de Google para la vinculación." };
                }
                
                // Now, link the Google credential to the signed-in user.
                await linkWithCredential(userCredential.user, googleCredential);
                console.log(`[Google Auth] Account linked successfully.`);

                // After successful link, fetch profile and claims again
                await fetchUserProfile(userCredential.user);
                
                return { error: undefined };

            } catch (linkError: any) {
                console.error("Google Account Linking Error:", linkError.code, linkError.message);
                const errorMessage = linkError.code === 'auth/wrong-password' ? 'La contraseña es incorrecta.' : linkError.message;
                return { error: `No se pudo vincular la cuenta. ${errorMessage}`};
            }
        }
        
        return { error: `Google Sign-In Error: ${error.code}` };
    }
  };

  const logout = async () => {
    if (!authInstance) return;
    await signOut(authInstance);
    router.push('/');
    router.refresh();
  };

  const value = {
    user,
    userProfile,
    loading,
    claims,
    refreshUserProfile,
    signUpWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
        {children}
    </AuthContext.Provider>
  );
};
