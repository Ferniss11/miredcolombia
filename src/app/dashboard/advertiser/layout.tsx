'use client';

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdvertiserLayout({ children }: { children: React.ReactNode }) {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si la carga ha finalizado y el perfil existe PERO el rol no es Advertiser,
    // lo redirigimos al dashboard principal.
    if (!loading && userProfile && userProfile.role !== 'Advertiser') {
        router.push('/dashboard');
    }
  }, [userProfile, loading, router]);

  if (loading || !userProfile || userProfile.role !== 'Advertiser') {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
