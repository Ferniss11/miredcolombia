
import { Suspense } from 'react';
import DashboardPageClient from '@/components/dashboard/DashboardPageClient';
import { Loader2 } from 'lucide-react';

function DashboardLoading() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardPageClient />
    </Suspense>
  );
}
