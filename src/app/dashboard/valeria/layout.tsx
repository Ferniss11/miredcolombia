
'use client';

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function ValeriaLayout({ children }: { children: React.ReactNode }) {
  const { user, claims, loading } = useAuth();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (loading) {
      return; // Wait until Firebase Auth is initialized
    }

    if (!user) {
      router.replace('/login');
      return;
    }
    
    const plan = claims?.valeria_plan;
    if (plan !== 'colombia' && plan !== 'espana') {
      router.replace('/valeria'); // Redirect to upgrade page if no valid plan
    } else {
      setIsVerifying(false); // Verification complete, user has access
    }
    
  }, [user, claims, loading, router]);

  if (loading || isVerifying) {
    return (
      <div className="flex items-center justify-center h-full min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="text-muted-foreground">Verificando tu suscripción...</p>
        </div>
      </div>
    );
  }

  // If loading and verification are done, and user was not redirected, render children
  return <>{children}</>;
}
