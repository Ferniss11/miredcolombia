
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import DebugInfoCard from '@/components/debug/DebugInfoCard';

export default function DashboardPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const customToken = searchParams.get('customToken');

  useEffect(() => {
    // Wait until loading is finished to make a decision
    if (!loading && !customToken) { // Also wait if we're in the middle of a custom token sign-in
      if (userProfile) {
        if (userProfile.role === 'Admin') {
          router.replace('/dashboard/admin');
        } else if (userProfile.role === 'Advertiser') {
          router.replace('/dashboard/advertiser');
        }
      } else if (!user) {
        // If there's no user and we're done loading, they shouldn't be here.
        router.replace('/login');
      }
    }
  }, [user, userProfile, loading, router, customToken]);

  // Show a full-screen loader while loading, or if redirection is about to happen,
  // or if we are processing a custom token login.
  if (loading || customToken || (userProfile && (userProfile.role === 'Admin' || userProfile.role === 'Advertiser'))) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Generic dashboard for 'User' role, or if a user has no role defined.
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
          <DebugInfoCard title="User Profile Object" description="Datos del perfil desde Firestore." data={userProfile} />
      </div>
    </div>
  );
}
