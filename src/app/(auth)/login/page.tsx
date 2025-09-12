'use client';

import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";


export default function LoginPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
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
  
  // After login, when we have a user but are waiting for profile/redirect, show a specific loader.
  if (user) {
    return (
        <Card className="w-full max-w-md mx-auto">
            <CardContent className="pt-6 text-center space-y-4">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <h2 className="text-xl font-semibold">¡Perfecto!</h2>
                <p className="text-muted-foreground">Te estamos redirigiendo a tu panel...</p>
            </CardContent>
        </Card>
    );
  }

  // If no user, show the login form
  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2 font-headline">Bienvenido de Nuevo</h1>
      <p className="text-center text-muted-foreground mb-8 font-body">
        ¿No tienes una cuenta?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Regístrate
        </Link>
      </p>
      <LoginForm />
    </div>
  );
}
