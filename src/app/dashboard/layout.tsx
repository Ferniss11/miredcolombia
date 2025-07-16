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
        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
           <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
            <SidebarTrigger />
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
             {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
