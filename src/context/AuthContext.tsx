
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  type Auth,
  type AuthError
} from 'firebase/auth';
import { getFirebaseServices } from '@/lib/firebase/config';
import type { UserProfile, UserRole } from '@/lib/types';

// --- Helper function to create profile via API ---
async function ensureUserProfileExists(user: User, name: string, role: UserRole): Promise<void> {
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
  } catch (error) {
    console.error("Failed to create user profile via API:", error);
    throw error;
  }
}


interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshUserProfile: () => Promise<void>;
  // --- Auth methods ---
  signUpWithEmail: (name: string, email: string, password: string, role: UserRole) => Promise<{ error: AuthError | null }>;
  loginWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  loginWithGoogle: (role: UserRole) => Promise<{ error: AuthError | null }>;
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
  
  // Hold the auth instance in a ref to keep it stable across renders
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);


  const fetchUserProfile = useCallback(async (firebaseUser: User | null) => {
    if (firebaseUser) {
      try {
        const idToken = await firebaseUser.getIdToken();
        const response = await fetch(`/api/users/${firebaseUser.uid}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch user profile from API.');
        }
        const profile = await response.json();
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
      }
    } else {
      setUserProfile(null);
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (user) {
        setLoading(true);
        await fetchUserProfile(user);
        setLoading(false);
    }
  }, [user, fetchUserProfile]);


  useEffect(() => {
    try {
        const { auth } = getFirebaseServices();
        setAuthInstance(auth);

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          setLoading(true);
          setUser(firebaseUser);
          await fetchUserProfile(firebaseUser);
          setLoading(false);
        });

        return () => unsubscribe();
    } catch (error) {
        console.error("Firebase initialization failed in AuthProvider:", error);
        setLoading(false);
    }
  }, [fetchUserProfile]);

  // --- Auth Method Implementations ---

  const signUpWithEmail = async (name: string, email: string, password: string, role: UserRole) => {
    if (!authInstance) return { error: { code: 'auth/unavailable', message: 'Firebase not initialized' } as AuthError };
    try {
        const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
        await ensureUserProfileExists(userCredential.user, name, role);
        return { error: null };
    } catch (error) {
        return { error: error as AuthError };
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    if (!authInstance) return { error: { code: 'auth/unavailable', message: 'Firebase not initialized' } as AuthError };
    try {
        await signInWithEmailAndPassword(authInstance, email, password);
        return { error: null };
    } catch (error) {
        return { error: error as AuthError };
    }
  };

  const loginWithGoogle = async (role: UserRole) => {
    if (!authInstance) return { error: { code: 'auth/unavailable', message: 'Firebase not initialized' } as AuthError };
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(authInstance, provider);
        const user = result.user;
        await ensureUserProfileExists(user, user.displayName || 'Usuario de Google', role);
        return { error: null };
    } catch (error) {
      const authError = error as AuthError;
        if (authError.code === 'auth/account-exists-with-different-credential') {
             return { error: { ...authError, message: "Ya existe una cuenta con este email. Inicia sesión con tu contraseña para vincular tu cuenta de Google." }};
        }
        // This will now catch the popup-closed-by-user error more cleanly if it still occurs
        console.error("Google Sign-In Error:", authError.code, authError.message);
        return { error: authError };
    }
  };

  const logout = async () => {
    if (!authInstance) return;
    await signOut(authInstance);
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
