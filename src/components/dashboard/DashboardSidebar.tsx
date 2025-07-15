
"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutGrid,
  User,
  LogOut,
  Megaphone,
  BarChart2,
  Sparkles,
  Home,
  FileText,
  Bot,
  Building,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { signOutUser } from "@/lib/firebase/auth";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const advertiserNav = [
    { href: "/dashboard/advertiser", label: "Resumen", icon: BarChart2 },
    { href: "/dashboard/advertiser/ads", label: "Anuncios", icon: Megaphone },
    { href: "/dashboard/advertiser/profile", label: "Perfil", icon: User },
  ];

  const adminNav = [
    { href: "/dashboard/admin", label: "Resumen", icon: LayoutGrid },
    { href: "/dashboard/admin/blog", label: "Gestión de Blog", icon: FileText },
    { href: "/dashboard/admin/content", label: "Suite de Contenido IA", icon: Sparkles },
    { href: "/dashboard/admin/agent", label: "Gestión de Agente", icon: Bot },
    { href: "/dashboard/admin/directory", label: "Directorio", icon: Building },
  ];

  const handleSignOut = async () => {
    await signOutUser();
    toast({ title: "Has cerrado sesión." });
    router.push("/");
    router.refresh();
  };
  
  const role = userProfile?.role;
  const navItems = role === 'Admin' ? adminNav : role === 'Advertiser' ? advertiserNav : [];

  const getRoleDisplayName = () => {
    if (role === 'Admin') return 'Administrador';
    if (role === 'Advertiser') return 'Anunciante';
    return 'Usuario';
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
           <Image src="https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FLOGO.png?alt=media&token=86f8e9f6-587a-4cb6-bae1-15b0c815f22b" alt="Mi Red Colombia Logo" width={40} height={40} />
          <div className="flex flex-col">
            <h3 className="font-semibold text-lg font-headline">Mi Red Colombia</h3>
            <p className="text-xs text-muted-foreground">Panel de {getRoleDisplayName()}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href)}
                  icon={item.icon}
                  tooltip={item.label}
                >
                  {item.label}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/">
                  <SidebarMenuButton icon={Home} tooltip="Volver al Sitio">
                  Volver al Sitio
                  </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton icon={LogOut} tooltip="Cerrar Sesión" onClick={handleSignOut}>
                Cerrar Sesión
              </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
