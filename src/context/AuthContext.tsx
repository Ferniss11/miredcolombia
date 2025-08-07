
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  type Auth,
  type AuthError,
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
    
    // A 409 conflict is acceptable, it means the profile already exists.
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
async function getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!uid) return null;
     try {
        const idToken = await getFirebaseServices().auth.currentUser?.getIdToken();
        if (!idToken) {
           console.warn(`[AuthContext] getUserProfile: No idToken available for UID ${uid}. User might be logged out.`);
           return null;
        }

        const response = await fetch(`/api/users/${uid}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });
        if (response.status === 404) {
            return null;
        }
        if (!response.ok) {
            throw new Error('Failed to fetch user profile from API.');
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
  refreshUserProfile: () => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string, role: UserRole) => Promise<{ error: AuthError | null }>;
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
  
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);
  const router = useRouter();

  const fetchUserProfile = useCallback(async (firebaseUser: User | null) => {
    if (firebaseUser) {
      try {
        // Force refresh the token to get the latest custom claims.
        // This is crucial for role-based access control.
        await firebaseUser.getIdToken(true); 
        const profile = await getUserProfile(firebaseUser.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error("[AuthContext] Error fetching user profile:", error);
        setUserProfile(null);
      }
    } else {
      setUserProfile(null);
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

  const signUpWithEmail = async (name: string, email: string, password: string, role: UserRole) => {
    if (!authInstance) return { error: { code: 'auth/unavailable', message: 'Firebase not initialized' } as AuthError };
    try {
        const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
        await ensureUserProfileExists(userCredential.user, name, role);
        await fetchUserProfile(userCredential.user);
        return { error: null };
    } catch (error) {
        return { error: error as AuthError };
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    if (!authInstance) return { error: { code: 'auth/unavailable', message: 'Firebase not initialized' } as AuthError };
    try {
        // The onAuthStateChanged listener will handle fetching the profile
        // and its useEffect will handle the custom claim refresh.
        await signInWithEmailAndPassword(authInstance, email, password);
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
        const profile = await getUserProfile(user.uid);
        
        if (!profile) {
            console.log(`[Google Auth] No profile found. Creating new user profile for ${user.email}`);
            await ensureUserProfileExists(user, user.displayName || 'Usuario de Google', role);
            console.log(`[Google Auth] User profile created. Fetching fresh profile...`);
            await fetchUserProfile(user);
            console.log(`[Google Auth] Fresh profile fetched.`);
        } else {
            console.log(`[Google Auth] Existing profile found. Forcing token refresh to sync claims.`);
            // User exists, force a token refresh to get latest claims
            await user.getIdToken(true);
            await refreshUserProfile();
             console.log(`[Google Auth] Token refreshed and profile re-fetched.`);
        }

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
                const password = prompt(`Ya existe una cuenta con ${email}. Por favor, introduce la contraseña de esa cuenta para vincularla con Google.`);
                if (!password || !authInstance.currentUser) {
                    return { error: "Vinculación cancelada. Contraseña no introducida." };
                }
                
                const credential = EmailAuthProvider.credential(email, password);
                
                await linkWithCredential(authInstance.currentUser, credential);
                 console.log(`[Google Auth] Account linked successfully.`);
                return { error: undefined };

            } catch (linkError: any) {
                console.error("Google Account Linking Error:", linkError.code, linkError.message);
                return { error: `No se pudo vincular la cuenta. ${linkError.message}`};
            }
        }
        
        return { error: `Google Sign-In Error: ${error.code} ${error.message}` };
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
