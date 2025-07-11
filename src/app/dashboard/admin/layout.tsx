'use client';

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si no está cargando y (no hay perfil o el rol no es Admin), redirige.
    if (!loading && (!userProfile || userProfile.role !== 'Admin')) {
      router.push('/dashboard');
    }
  }, [userProfile, loading, router]);

  // Muestra el loader si:
  // 1. El estado de autenticación general está cargando.
  // 2. O si todavía no tenemos un userProfile (incluso si loading es false).
  // 3. O si el rol del perfil todavía no es 'Admin'.
  // Esto asegura que no mostramos el contenido de admin hasta que estemos 100% seguros.
  if (loading || !userProfile || userProfile.role !== 'Admin') {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
