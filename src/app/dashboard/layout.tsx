import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <DashboardSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
            <SidebarTrigger />
          </header>
          {/* Eliminamos overflow-auto de aquí para un control más granular en cada página */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
