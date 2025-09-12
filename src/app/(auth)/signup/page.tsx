'use client';

import { SignUpForm } from "@/components/auth/SignUpForm";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function SignUpPageComponent() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirige solo cuando la carga ha terminado y tenemos tanto el usuario como el perfil
    if (!loading && user && userProfile) {
      router.push('/dashboard');
    }
  }, [user, userProfile, loading, router]);
  
  // Show skeleton loader while initial auth state is loading
  if (loading) {
      return (
          <div className="w-full max-w-md mx-auto space-y-8">
              <Skeleton className="h-10 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
              <Skeleton className="h-64 w-full" />
          </div>
      )
  }

  // After signup, when we have a user but are waiting for profile/redirect, show a specific loader.
  if (user) {
    return (
        <Card className="w-full max-w-md mx-auto">
            <CardContent className="pt-6 text-center space-y-4">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <h2 className="text-xl font-semibold">¡Cuenta Creada!</h2>
                <p className="text-muted-foreground">Te estamos redirigiendo a tu panel...</p>
            </CardContent>
        </Card>
    );
  }

  // If no user, show the signup form
  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2 font-headline">Crear una Cuenta</h1>
      <p className="text-center text-muted-foreground mb-8 font-body">
        ¿Ya tienes una cuenta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
      <SignUpForm />
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpPageComponent />
    </Suspense>
  )
}
