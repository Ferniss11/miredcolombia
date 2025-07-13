'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, firebaseInitialized } from '@/lib/firebase/config';
import { getUserProfile } from '@/services/user.service';
import type { UserProfile } from '@/lib/types';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirebaseError, setIsFirebaseError] = useState(false);

  useEffect(() => {
    // Check for Firebase initialization status only on the client side.
    if (!firebaseInitialized) {
      console.error("Firebase config is missing or incomplete. Please check NEXT_PUBLIC_FIREBASE variables in your .env file.");
      setIsFirebaseError(true);
      setLoading(false);
      return;
    }

    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
        } else {
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  const value = { user, userProfile, loading };

  if (isFirebaseError) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-lg border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle />
                  Error de Configuración de Firebase
                </CardTitle>
                <CardDescription>
                  Tu aplicación no puede conectarse a Firebase.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Parece que no has configurado tus variables de entorno de Firebase. Para que la autenticación y la base de datos funcionen, debes añadir tus claves de proyecto de Firebase al archivo <code className="bg-muted px-1 py-0.5 rounded font-mono text-sm">.env</code> en la raíz de tu proyecto.
                </p>
                <div className="bg-muted p-4 rounded-md text-sm">
                  <p>Copia y pega lo siguiente en tu archivo <code className="font-mono">.env</code> y rellénalo con tus propias claves:</p>
                  <pre className="mt-2 text-xs overflow-x-auto">
                    {`NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...`}
                  </pre>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Puedes encontrar estas claves en la configuración de tu proyecto de Firebase. Una vez que las hayas añadido, reinicia el servidor de desarrollo para aplicar los cambios.
                </p>
              </CardContent>
            </Card>
          </div>
      )
  }

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-screen">
             <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
      )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
