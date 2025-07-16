import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <DashboardSidebar />
        <main className="flex flex-1 flex-col overflow-y-auto">
           <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
            <SidebarTrigger />
          </header>
          <div className="flex-1 p-4 sm:p-6 lg:p-8">
             {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
