
'use client';

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // If loading is finished and there's no user, they shouldn't be here.
      if (!user) {
        router.replace('/login');
      } 
      // If there is a user, but their profile hasn't loaded or their role isn't Admin,
      // send them to the main dashboard to be redirected appropriately.
      else if (!userProfile || userProfile.role !== 'Admin') {
        router.replace('/dashboard');
      }
    }
  }, [user, userProfile, loading, router]);

  // Show a loader while authentication is in progress or if the user is not yet verified as an Admin.
  // This prevents non-admins from even briefly seeing the admin layout.
  if (loading || !userProfile || userProfile.role !== 'Admin') {
    return (
      <div className="flex items-center justify-center h-full min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is done and the user is an admin, render the children.
  return <>{children}</>;
}
