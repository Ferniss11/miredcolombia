'use client';

import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && userProfile) {
      router.push('/dashboard');
    }
  }, [user, userProfile, loading, router]);
  
  // Show skeleton loader while loading OR if we have a user but are waiting for the profile to load before redirecting
  if (loading || (user && !userProfile)) {
      return (
          <div className="w-full max-w-md mx-auto space-y-8">
              <Skeleton className="h-10 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
              <Skeleton className="h-64 w-full" />
          </div>
      )
  }

  // Don't render the form if the user is already logged in and has a profile (they will be redirected soon)
  if (user && userProfile) {
    return null;
  }

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
