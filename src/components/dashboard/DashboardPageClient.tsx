
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import DebugInfoCard from '@/components/debug/DebugInfoCard';
import { useSearchParams } from 'next/navigation';

export default function DashboardPageClient() {
  const { user, userProfile, loading, claims } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const customToken = searchParams.get('customToken'); // This might be from a previous implementation, safe to keep for now

  useEffect(() => {
    if (!loading && !customToken) {
      if (userProfile) {
        // The role from the userProfile (Firestore) is used for initial redirection logic.
        // The actual security is enforced by custom claims on the backend.
        if (userProfile.role === 'Admin') {
          router.replace('/dashboard/admin');
        } else if (userProfile.role === 'Advertiser') {
          router.replace('/dashboard/advertiser');
        }
      } else if (!user) {
        router.replace('/login');
      }
    }
  }, [user, userProfile, loading, router, customToken]);

  // Show a full-screen loader while loading or if redirection is about to happen.
  if (loading || customToken || (userProfile && (userProfile.role === 'Admin' || userProfile.role === 'Advertiser'))) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Generic dashboard for 'User' role.
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
      
      <div className="grid gap-6 md:grid-cols-2 mt-6">
          <DebugInfoCard title="Auth User Object" description="Datos del usuario desde Firebase Authentication." data={user} />
          <DebugInfoCard title="User Profile (Firestore)" description="Datos del perfil desde Firestore." data={userProfile} />
          <DebugInfoCard title="Auth Token Claims" description="Claims decodificados del token de autenticación (incluye el rol)." data={claims} />
      </div>
    </div>
  );
}
