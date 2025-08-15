
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Briefcase, Home, Handshake, ArrowRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../ui/button';

// A reusable card for quick actions
const ActionCard = ({ title, description, icon: Icon, href }: { title: string, description: string, icon: React.ElementType, href: string }) => (
    <Card className="hover:border-primary/50 hover:shadow-lg transition-all group">
        <Link href={href} className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="font-headline text-xl">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-muted-foreground">{description}</p>
            </CardContent>
            <CardFooter>
                 <Button variant="link" className="p-0 text-primary">
                    Gestionar <ArrowRight className="ml-2 h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                </Button>
            </CardFooter>
        </Link>
    </Card>
);

export default function DashboardPageClient() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const customToken = searchParams.get('customToken');

  useEffect(() => {
    if (!loading && !customToken) {
      if (userProfile) {
        if (userProfile.role === 'Admin' || userProfile.role === 'SAdmin') {
          router.replace('/dashboard/admin');
        } else if (userProfile.role === 'Advertiser') {
          router.replace('/dashboard/advertiser');
        }
      } else if (!user) {
        router.replace('/login');
      }
    }
  }, [user, userProfile, loading, router, customToken]);

  if (loading || customToken || !userProfile || userProfile.role !== 'User') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Bienvenido, {userProfile?.name || 'Usuario'}</CardTitle>
          <CardDescription className="text-base">
            Este es tu espacio personal. Desde aquí puedes gestionar tu perfil profesional, tus propiedades y los servicios que ofreces a la comunidad.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <ActionCard 
            title="Mi Perfil Profesional"
            description="Mantén tu CV y tus habilidades actualizadas para no perder ninguna oportunidad de empleo."
            icon={Briefcase}
            href="/dashboard/candidate-profile"
         />
         <ActionCard 
            title="Mis Propiedades"
            description="Gestiona los inmuebles que has publicado en nuestro portal inmobiliario."
            icon={Home}
            href="/dashboard/my-properties"
         />
         <ActionCard 
            title="Mis Servicios"
            description="Administra los servicios profesionales que ofreces a la comunidad."
            icon={Handshake}
            href="/dashboard/my-services"
         />
      </div>
    </div>
  );
}
