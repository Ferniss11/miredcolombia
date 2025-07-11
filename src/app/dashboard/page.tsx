'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && userProfile) {
      if (userProfile.role === 'Admin') {
        router.replace('/dashboard/admin');
      } else if (userProfile.role === 'Advertiser') {
        router.replace('/dashboard/advertiser');
      }
    }
  }, [userProfile, loading, router]);

  // Show a full-screen loader while redirecting or for roles that will be redirected
  if (loading || (userProfile && (userProfile.role === 'Admin' || userProfile.role === 'Advertiser'))) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Generic dashboard for 'User' role
  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-6">Panel de Usuario</h1>
      <Card>
        <CardHeader>
          <CardTitle>Bienvenido, {userProfile?.name || 'Usuario'}</CardTitle>
          <CardDescription>
            Este es tu panel de usuario general.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Desde aquí podrás gestionar tus servicios contratados o actualizar tu información.
          </p>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
            <CardTitle>Información de Depuración del Usuario</CardTitle>
            <CardDescription>
              Estos son los datos que se están leyendo de Firebase Auth y Firestore.
              Usa esto para verificar que tu rol es el correcto.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <div>
                    <h3 className="font-semibold">Objeto User (de Firebase Auth)</h3>
                    <pre className="mt-2 w-full overflow-x-auto rounded-md bg-muted p-4 text-sm">
                        {user ? JSON.stringify(user, null, 2) : 'No hay usuario autenticado.'}
                    </pre>
                </div>
                <div>
                    <h3 className="font-semibold">Objeto UserProfile (de Firestore)</h3>
                     <pre className="mt-2 w-full overflow-x-auto rounded-md bg-muted p-4 text-sm">
                        {userProfile ? JSON.stringify(userProfile, null, 2) : 'No se encontró perfil en Firestore.'}
                    </pre>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
