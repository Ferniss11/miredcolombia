
"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
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
  Bug,
  MessageSquare,
  Scale,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { ThemeToggle } from "../ui/theme-toggle";

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile, logout } = useAuth();
  const { toast } = useToast();
  const { state } = useSidebar();

  const advertiserNav = [
    { href: "/dashboard/advertiser", label: "Resumen", icon: LayoutGrid },
    { href: "/dashboard/jobs", label: "Empleos", icon: FileText }, // Added for Advertiser
    { href: "/dashboard/advertiser/agent", label: "Agente IA", icon: Bot },
    { href: "/dashboard/advertiser/conversations", label: "Conversaciones", icon: MessageSquare },
    { href: "/dashboard/advertiser/analytics", label: "Analíticas IA", icon: BarChart2 },
    { href: "/dashboard/advertiser/ads", label: "Anuncios", icon: Megaphone },
    { href: "/dashboard/advertiser/profile", label: "Perfil", icon: User },
  ];

  const adminNav = [
    { href: "/dashboard/admin", label: "Resumen", icon: LayoutGrid },
    { href: "/dashboard/jobs", label: "Empleos", icon: FileText }, // Added for Admin
    { href: "/dashboard/admin/blog", label: "Blog", icon: FileText },
    { href: "/dashboard/admin/content", label: "Contenido IA", icon: Sparkles },
    { href: "/dashboard/admin/agent", label: "Agente Global", icon: Bot },
    { href: "/dashboard/admin/conversations", label: "Conversaciones", icon: MessageSquare },
    { href: "/dashboard/admin/directory", label: "Directorio", icon: Building },
    { href: "/dashboard/admin/economics", label: "IA Económico", icon: Scale },
    { href: "/dashboard/admin/debug", label: "Depuración", icon: Bug },
  ];

  const userNav = [
    { href: "/dashboard/candidate-profile", label: "Mi Perfil", icon: Briefcase },
  ];

  const handleSignOut = async () => {
    await logout();
    toast({ title: "Has cerrado sesión." });
    router.push("/");
  };
  
  const role = userProfile?.role;
  let navItems;
  if (role === 'Admin') {
    navItems = adminNav;
  } else if (role === 'Advertiser') {
    navItems = advertiserNav;
  } else if (role === 'User') {
    navItems = userNav;
  } else {
    navItems = [];
  }

  const getRoleDisplayName = () => {
    if (role === 'Admin') return 'Administrador';
    if (role === 'Advertiser') return 'Anunciante';
    return 'Usuario';
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 overflow-hidden">
          <Image src="https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FLOGO.png?alt=media&token=86f8e9f6-587a-4cb6-bae1-15b0c815f22b" alt="Mi Red Colombia Logo" width={40} height={40} className="rounded-md shrink-0"/>
          <div style={{ display: state === 'collapsed' ? 'none' : 'block' }}>
            <h3 className="font-semibold text-lg font-headline truncate">Mi Red Colombia</h3>
            <p className="text-xs text-muted-foreground truncate">Panel de {getRoleDisplayName()}</p>
          </div>
        </div>
        <div className="hidden md:block ml-auto">
            <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== '/dashboard/admin' && item.href !== '/dashboard/advertiser' && pathname.startsWith(item.href))}
                  icon={item.icon}
                  tooltip={item.label}
                  data-state={state}
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
            <ThemeToggle data-state={state} />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/">
                <SidebarMenuButton icon={Home} tooltip="Volver al Sitio" data-state={state}>
                  Volver al Sitio
                </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton icon={LogOut} tooltip="Cerrar Sesión" onClick={handleSignOut} data-state={state}>
              Cerrar Sesión
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
