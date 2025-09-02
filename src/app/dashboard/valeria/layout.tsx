
'use client';

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ValeriaLayout({ children }: { children: React.ReactNode }) {
  const { user, claims, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // If loading is finished and there's no user, redirect to login.
      if (!user) {
        router.replace('/login');
        return;
      }
      
      // If there is a user, check their subscription claim.
      const plan = claims?.valeria_plan;
      if (plan !== 'colombia' && plan !== 'espana') {
        // If they don't have a valid plan, redirect them.
        // Maybe to the public valeria page to upgrade.
        router.replace('/valeria');
      }
    }
  }, [user, claims, loading, router]);

  // Show a loader while authentication and claim verification is in progress.
  if (loading || !claims || (claims.valeria_plan !== 'colombia' && claims.valeria_plan !== 'espana')) {
    return (
      <div className="flex items-center justify-center h-full min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is done and the user has a valid plan, render the children.
  return <>{children}</>;
}
