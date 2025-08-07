'use client';

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si la carga ha finalizado y el perfil existe PERO el rol no es Admin,
    // lo redirigimos al dashboard principal, que decidirá a dónde enviarlo.
    if (!loading && userProfile && userProfile.role !== 'Admin') {
      router.push('/dashboard');
    }
    // Ya no se maneja el caso de !userProfile, ya que la redirección de logout
    // se gestiona centralmente en AuthContext, y las páginas protegidas
    // mostrarán un loader hasta que el perfil se resuelva.
  }, [userProfile, loading, router]);

  // Muestra el loader si el estado de autenticación está cargando,
  // o si aún no tenemos un perfil, o si el rol no es 'Admin'.
  // Esto previene mostrar contenido de admin a usuarios no autorizados.
  if (loading || !userProfile || userProfile.role !== 'Admin') {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
