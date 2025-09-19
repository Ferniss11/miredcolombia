
'use client';

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
  Users as UsersIcon,
  Handshake,
  HomeIcon,
  BookOpen,
  Mails,
  ChevronDown,
  TestTube2,
  BrainCircuit,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { ThemeToggle } from "../ui/theme-toggle";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { cn } from "@/lib/utils";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { userProfile, logout, claims } = useAuth();
  const { toast } = useToast();
  const { state } = useSidebar();
  
  const hasValeriaPlan = claims?.valeria_plan === 'valeria_premium' || claims?.valeria_plan === 'valeria_pro';

  const advertiserNav = [
    { href: "/dashboard/advertiser", label: "Resumen", icon: LayoutGrid },
    { href: "/dashboard/jobs", label: "Empleos", icon: Briefcase },
    { href: "/dashboard/my-properties", label: "Mis Propiedades", icon: HomeIcon },
    { href: "/dashboard/my-services", label: "Mis Servicios", icon: Handshake }, 
    { href: "/dashboard/advertiser/agent", label: "Agente IA", icon: Bot },
    { href: "/dashboard/advertiser/conversations", label: "Conversaciones", icon: MessageSquare },
    { href: "/dashboard/advertiser/analytics", label: "Analíticas IA", icon: BarChart2 },
    { href: "/dashboard/advertiser/ads", label: "Anuncios", icon: Megaphone },
    { href: "/dashboard/advertiser/profile", label: "Perfil", icon: User },
  ];

  const adminNav = [
    {
      category: 'Principal',
      items: [
        { href: "/dashboard/admin", label: "Resumen", icon: LayoutGrid },
        { href: "/dashboard/admin/users", label: "Usuarios", icon: UsersIcon },
      ]
    },
    {
      category: 'Contenido y Leads',
      items: [
        { href: "/dashboard/admin/content", label: "Contenido IA", icon: Sparkles },
        { href: "/dashboard/admin/blog", label: "Blog", icon: FileText },
        { href: "/dashboard/admin/guides", label: "Guías", icon: BookOpen },
        { href: "/dashboard/admin/email-sequences", label: "Secuencias Email", icon: Mails },
      ]
    },
    {
      category: 'IA y Supervisión',
      items: [
        { href: "/dashboard/admin/agent", label: "Gestión de Agentes", icon: Bot },
        { href: "/dashboard/admin/agent-lab", label: "Laboratorio IA", icon: TestTube2 },
        { href: "/dashboard/admin/knowledge-base", label: "Base de Conocimiento", icon: BrainCircuit },
        { href: "/dashboard/admin/conversations", label: "Conversaciones", icon: MessageSquare },
      ]
    },
    {
      category: 'Gestión de Portales',
      items: [
        { href: "/dashboard/admin/directory", label: "Directorio", icon: Building },
        { href: "/dashboard/jobs", label: "Empleos", icon: Briefcase },
        { href: "/dashboard/my-properties", label: "Propiedades", icon: HomeIcon },
        { href: "/dashboard/my-services", label: "Servicios", icon: Handshake },
      ]
    },
    {
      category: 'Plataforma',
      items: [
        { href: "/dashboard/admin/economics", label: "IA Económico", icon: Scale },
        { href: "/dashboard/admin/debug", label: "Depuración", icon: Bug },
      ]
    },
  ];

  const userNav = [
    { href: "/dashboard", label: "Resumen", icon: LayoutGrid },
    ...(hasValeriaPlan ? [{ href: "/dashboard/valeria", label: "Valeria Premium", icon: Sparkles }] : []),
    { href: "/dashboard/candidate-profile", label: "Mi Perfil Profesional", icon: Briefcase },
    { href: "/dashboard/my-properties", label: "Mis Propiedades", icon: HomeIcon },
    { href: "/dashboard/my-services", label: "Mis Servicios", icon: Handshake },
  ];

  const handleSignOut = async () => {
    await logout();
    toast({ title: "Has cerrado sesión." });
  };
  
  const role = userProfile?.role;
  let navItems;
  let isGrouped = false;

  if (role === 'Admin' || role === 'SAdmin') {
    navItems = adminNav;
    isGrouped = true;
  } else if (role === 'Advertiser') {
    navItems = advertiserNav;
  } else if (role === 'User') {
    navItems = userNav;
  } else {
    navItems = [];
  }

  const getRoleDisplayName = () => {
    if (role === 'SAdmin') return 'Super Admin';
    if (role === 'Admin') return 'Administrador';
    if (role === 'Advertiser') return 'Anunciante';
    return 'Usuario';
  }

  const isActive = (href: string) => {
    return pathname === href || (href !== '/dashboard' && href !== '/dashboard/admin' && href !== '/dashboard/advertiser' && pathname.startsWith(href));
  }
  
  const renderAllAdminItems = () => {
    return adminNav.flatMap(group => group.items).map(item => (
       <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            <SidebarMenuButton isActive={isActive(item.href)} icon={item.icon} tooltip={item.label} data-state={state}>
              {item.label}
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
    ));
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 overflow-hidden">
          <Image src="https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FLOGO.png?alt=media&token=86f8e9f6-587a-4cb6-bae1-15b0c815f22b" alt="Mi Red Colombia Logo" width={32} height={32} className="rounded-md shrink-0"/>
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
          {isGrouped ? (
            state === 'expanded' ? (
              adminNav.map((group) => (
                <Collapsible key={group.category} defaultOpen={true}>
                  <CollapsibleTrigger
                    className={cn("w-full", state === "collapsed" && "hidden")}
                    disabled={state === "collapsed"}
                  >
                    <div className="flex items-center justify-between p-2 hover:bg-sidebar-accent rounded-md">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{group.category}</h4>
                      <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="pl-2 pr-0 pt-0 pb-1">
                        {group.items.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <Link href={item.href}>
                                    <SidebarMenuButton isActive={isActive(item.href)} icon={item.icon} tooltip={item.label} data-state={state}>
                                        {item.label}
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              ))
            ) : (
              // Render only icons when collapsed
              renderAllAdminItems()
            )
          ) : (
            (navItems as { href: string; label: string; icon: React.ElementType }[]).map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton isActive={isActive(item.href)} icon={item.icon} tooltip={item.label} data-state={state}>
                    {item.label}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))
          )}
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
