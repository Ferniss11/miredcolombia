
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
  reauthenticateWithPopup,
} from 'firebase/auth';
import { getFirebaseServices } from '@/lib/firebase/config';
import type { UserProfile, UserRole } from '@/lib/types';
import { syncUserRoleAction } from '@/lib/user/infrastructure/nextjs/user.server-actions';


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
  signUpWithEmail: (name: string, email: string, password: string, role: UserRole) => Promise<{ error: string | null, user: User | null }>;
  loginWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  loginWithGoogle: (role: UserRole) => Promise<{ error?: string }>;
  linkPasswordToAccount: (password: string) => Promise<{ error?: string | null }>;
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
        let idTokenResult = await firebaseUser.getIdTokenResult();
        const profile = await getUserProfile(firebaseUser.uid, idTokenResult.token);
        
        // --- Role Synchronization Logic ---
        const firestoreRole = profile?.role;
        const tokenRoles = (idTokenResult.claims.roles || []) as UserRole[];
        
        if (firestoreRole && tokenRoles.length === 0) {
            console.log(`[AuthContext] Legacy user detected (${firebaseUser.uid}). Synchronizing role to custom claims...`);
            await syncUserRoleAction(firebaseUser.uid);
            idTokenResult = await firebaseUser.getIdTokenResult(true); 
            console.log(`[AuthContext] Token refreshed. New claims:`, idTokenResult.claims);
        }
        
        setUserProfile(profile);
        setClaims(idTokenResult.claims);

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

  const signUpWithEmail = async (name: string, email: string, password: string, role: UserRole): Promise<{ error: string | null, user: User | null }> => {
    if (!authInstance) return { error: 'Firebase not initialized', user: null };
    try {
        const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
        await ensureUserProfileExists(userCredential.user, name, role);
        await userCredential.user.getIdToken(true); // Force token refresh to get claims
        await fetchUserProfile(userCredential.user);
        return { error: null, user: userCredential.user };
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            const methods = await fetchSignInMethodsForEmail(authInstance, email);
            if (methods.includes(GoogleAuthProvider.PROVIDER_ID)) {
                if (confirm("Ya tienes una cuenta con este email a través de Google. ¿Quieres vincular una contraseña a tu cuenta de Google para poder iniciar sesión con ambos métodos?")) {
                    try {
                        const googleProvider = new GoogleAuthProvider();
                        const result = await signInWithPopup(authInstance, googleProvider);
                        const credential = EmailAuthProvider.credential(email, password);
                        await linkWithCredential(result.user, credential);
                        await result.user.getIdToken(true);
                        await fetchUserProfile(result.user);
                        return { error: null, user: result.user };
                    } catch (linkError: any) {
                        return { error: `No se pudo vincular la cuenta: ${linkError.message}`, user: null };
                    }
                } else {
                    return { error: "Registro cancelado. Por favor, inicia sesión con Google.", user: null };
                }
            } else {
                return { error: "Este correo electrónico ya está registrado con una contraseña.", user: null };
            }
        }
        return { error: (error as AuthError).message, user: null };
    }
};

  const loginWithEmail = async (email: string, password: string) => {
    if (!authInstance) return { error: { code: 'auth/unavailable', message: 'Firebase not initialized' } as AuthError };
    try {
        const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
        await userCredential.user.getIdToken(true); // Force token refresh
        await fetchUserProfile(userCredential.user);
        return { error: null };
    } catch (error) {
        return { error: error as AuthError };
    }
  };
  
  const loginWithGoogle = async (role: UserRole) => {
    if (!authInstance) return { error: 'Firebase not initialized' };
    const provider = new GoogleAuthProvider();
    
    try {
        const result = await signInWithPopup(authInstance, provider);
        const user = result.user;
        const token = await user.getIdToken();
        const profile = await getUserProfile(user.uid, token);
        
        if (!profile) {
            await ensureUserProfileExists(user, user.displayName || 'Usuario de Google', role);
        }
        
        await user.getIdToken(true); // Crucial: Force token refresh to get claims
        await fetchUserProfile(user);
        
        return { error: undefined };

    } catch (error: any) {
        console.error("Google Sign-In Error:", error.code, error.message);
        if (error.code === 'auth/account-exists-with-different-credential') {
            const email = error.customData?.email;
            if (!email) {
                 return { error: "No se pudo obtener el email del proveedor."};
            }
            
            try {
                const password = prompt(`Ya tienes una cuenta con ${email} (registrada con email/contraseña). Por favor, introduce tu contraseña para vincular tu inicio de sesión con Google.`);
                if (!password) {
                    return { error: "Vinculación cancelada. Contraseña no introducida." };
                }
                const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
                const googleCredential = GoogleAuthProvider.credentialFromError(error);
                if (!googleCredential) {
                    return { error: "No se pudo obtener la credencial de Google para la vinculación." };
                }
                await linkWithCredential(userCredential.user, googleCredential);
                await userCredential.user.getIdToken(true);
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

  const linkPasswordToAccount = async (password: string) => {
    if (!authInstance || !user) {
        return { error: 'Usuario no autenticado.' };
    }
    try {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);
        const credential = EmailAuthProvider.credential(user.email!, password);
        await linkWithCredential(user, credential);
        return { error: null };
    } catch (error: any) {
        console.error("Error linking password to account:", error);
        return { error: `No se pudo establecer la contraseña: ${error.message}` };
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
    linkPasswordToAccount,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
        {children}
    </AuthContext.Provider>
  );
};
