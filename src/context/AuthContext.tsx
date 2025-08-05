
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithRedirect, 
  GoogleAuthProvider,
  signOut,
  getRedirectResult, // Import getRedirectResult
  type Auth,
  type AuthError,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
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

    // A 409 Conflict is okay, it means the profile already exists.
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
           // If the profile is not found (404), it might be a new user via redirect. Don't throw error yet.
          if (response.status === 404) {
            setUserProfile(null);
            return;
          }
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

        // --- Handle Redirect Result ---
        getRedirectResult(auth)
          .then(async (result) => {
            if (result) {
              // This is the user coming back from the redirect.
              const user = result.user;
              const pendingRole = sessionStorage.getItem('pendingRole') as UserRole | null;
              
              if (pendingRole) {
                // This was a new signup attempt.
                await ensureUserProfileExists(user, user.displayName || 'Usuario de Google', pendingRole);
                sessionStorage.removeItem('pendingRole'); // Clean up
              }
              // The onAuthStateChanged listener below will handle fetching the profile.
            }
          }).catch(error => {
            console.error("Error getting redirect result:", error);
          }).finally(() => {
             setLoading(false);
          });


        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            setUser(firebaseUser);
            await fetchUserProfile(firebaseUser);
          } else {
            setUser(null);
            setUserProfile(null);
          }
           // Only set loading to false after the first auth check is complete.
          // The redirect handling might finish later.
          if (loading) {
            setLoading(false);
          }
        });

        return () => unsubscribe();
    } catch (error) {
        console.error("Firebase initialization failed in AuthProvider:", error);
        setLoading(false);
    }
  // We only want this effect to run once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        // Set the role in session storage BEFORE redirecting
        sessionStorage.setItem('pendingRole', role);
        await signInWithRedirect(authInstance, provider);
        // The promise from signInWithRedirect never resolves as the page is left.
        // Logic continues in the getRedirectResult handler.
        return { error: null };
    } catch (error) {
      const authError = error as AuthError;
        if (authError.code === 'auth/account-exists-with-different-credential') {
             return { error: { ...authError, message: "Ya existe una cuenta con este email. Inicia sesión con tu contraseña para vincular tu cuenta de Google." }};
        }
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
