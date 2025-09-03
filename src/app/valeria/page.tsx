
'use client';

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, MessageCircle, PlayCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { useChat } from "@/context/ChatContext";
import { valeriaPlans } from "@/lib/placeholder-data";
import { useAuth } from "@/context/AuthContext";
import CheckoutSheet from "@/components/checkout/CheckoutSheet";
import type { ValeriaPlan } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import VideoModal from "@/components/ui/video-modal";


export default function ValeriaPage() {
  const { openChat } = useChat();
  const { user } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ValeriaPlan | null>(null);
  const [isVideoModalOpen, setVideoModalOpen] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const videoUrl = "https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FVideo%20de%20WhatsApp%202025-08-12%20a%20las%2014.29.54_0ca7af14.mp4?alt=media&token=ac0427e9-ff6e-4897-afba-3684d6ff5585";


  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'cancelled') {
      toast({
        title: 'Pago Cancelado',
        description: 'El proceso de pago fue cancelado. Puedes intentarlo de nuevo cuando quieras.',
        variant: 'default',
        duration: 5000,
      });
      // Remove the query parameter from the URL
      router.replace('/valeria', { scroll: false });
    }
  }, [searchParams, router, toast]);


  const handlePlanSelection = (plan: ValeriaPlan) => {
    if (!user && plan.id !== 'plan_free') {
      setSelectedPlan(plan);
      setIsSheetOpen(true);
    } else {
      // For logged-in users, or for the free plan, go to the appropriate page
      if (plan.id === 'plan_free') {
        openChat();
      } else {
        window.location.href = `/checkout/${plan.id}`;
      }
    }
  };


  return (
    <>
    <div className="bg-secondary/50 dark:bg-card">
        <div className="container mx-auto px-4 py-12 md:py-24">
            <div className="text-center mb-8">
                <Image
                    src="https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FImagen%20de%20WhatsApp%202025-08-09%20a%20las%2018.20.39_3c2b6161.jpg?alt=media&token=41ebe34a-f846-41fc-937f-4141f1240ee8"
                    alt="Avatar de Valeria, la asistente IA"
                    width={120}
                    height={120}
                    className="rounded-full mb-4 mx-auto border-4 border-primary/20 shadow-lg"
                />
                <h1 className="text-4xl md:text-5xl font-bold font-headline">Valeria, tu Asistente IA</h1>
                <p className="text-lg text-muted-foreground mt-2 font-body max-w-2xl mx-auto">
                    Valeria es la primera IA especializada en migración de Colombia a España. Disponible 24/7, habla tu idioma y responde al instante.
                </p>
                 <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" onClick={openChat}>
                        <MessageCircle className="mr-2 h-5 w-5" />
                        Empieza ahora con Valeria
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => setVideoModalOpen(true)}>
                        <PlayCircle className="mr-2 h-5 w-5" />
                        Ver Demo
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
                {valeriaPlans.map((plan) => (
                <Card 
                    key={plan.name} 
                    className={cn(
                        "flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300", 
                        plan.name === "Plan Colombia" && "border-primary border-2 shadow-primary/20"
                    )}
                >
                    {plan.name === "Plan Colombia" && (
                    <div className="bg-primary text-primary-foreground text-center py-1.5 text-sm font-semibold">
                        Recomendado
                    </div>
                    )}
                    <CardHeader className="items-center text-center">
                    <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
                    <div className="flex items-baseline">
                        <span className="text-4xl font-bold">{typeof plan.price === 'number' ? `${plan.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€` : plan.price}</span>
                        <span className="text-muted-foreground ml-1">{plan.priceDetails}</span>
                    </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                    <ul className="space-y-4">
                        {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                        </li>
                        ))}
                    </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant={plan.variant as any} onClick={() => handlePlanSelection(plan)}>
                            {plan.cta}
                        </Button>
                    </CardFooter>
                </Card>
                ))}
            </div>
            <div className="text-center mt-16">
                 <h3 className="text-xl font-bold font-headline">¿Necesitas ayuda personalizada?</h3>
                <p className="text-muted-foreground mt-2 mb-4">Nuestro equipo de expertos está listo para ayudarte con tus necesidades específicas.</p>
                <Button size="lg" asChild className="bg-gradient-to-r from-yellow-400 to-red-500 text-white shadow-lg hover:shadow-xl transition-shadow">
                    <Link href="/packs"> 
                        Contactar con un Asesor
                    </Link>
                </Button>
            </div>
        </div>
    </div>
    <CheckoutSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        plan={selectedPlan}
    />
     <VideoModal 
        isOpen={isVideoModalOpen}
        setIsOpen={setVideoModalOpen}
        videoUrl={videoUrl}
        title="Demostración de Valeria, tu Asistente IA"
    />
    </>
  );
}
