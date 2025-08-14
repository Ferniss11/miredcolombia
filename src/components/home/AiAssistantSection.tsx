

'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot, MessageCircle, Lightbulb, PlayCircle } from "lucide-react";
import RealTimeClocks from "@/components/layout/RealTimeClocks";
import { cn } from "@/lib/utils";
import Image from 'next/image';
import VideoModal from "../ui/video-modal";

const migrationTips = [
    "Recuerda apostillar todos tus documentos oficiales en Colombia antes de viajar.",
    "El empadronamiento es el primer trámite y el más importante al llegar a España. ¡No lo dejes para después!",
    "Si vienes con visa de estudiante, puedes trabajar hasta 30 horas semanales con un permiso de trabajo.",
    "Abre una cuenta bancaria tan pronto como tengas tu NIE. Facilitará todos los demás trámites.",
    "Investiga sobre el sistema de transporte público de tu ciudad, suele ser muy eficiente y económico.",
    "El seguro médico es obligatorio. Asegúrate de que tenga cobertura completa sin copagos.",
    "La 'TIE' (Tarjeta de Identidad de Extranjero) es tu documento de identificación físico en España.",
    "Guarda copias digitales de todos tus documentos importantes en la nube.",
    "No tengas miedo de preguntar. Los españoles suelen ser amables y dispuestos a ayudar.",
    "Para homologar tu título, el proceso puede tardar. ¡Inícialo cuanto antes!",
    "Conoce las diferencias culturales en los horarios de comida y de las tiendas."
];

export default function AiAssistantSection({ onOpenChatModal }: { onOpenChatModal: () => void }) {
    const [randomTip, setRandomTip] = useState('');
    const [animationKey, setAnimationKey] = useState(0);
    const [isVideoModalOpen, setVideoModalOpen] = useState(false);
    const videoUrl = "https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FVideo%20de%20WhatsApp%202025-08-12%20a%20las%2014.29.54_0ca7af14.mp4?alt=media&token=ac0427e9-ff6e-4897-afba-3684d6ff5585";


    useEffect(() => {
        const getNextTip = () => {
            setRandomTip(prevTip => {
                let newTip;
                do {
                    newTip = migrationTips[Math.floor(Math.random() * migrationTips.length)];
                } while (newTip === prevTip);
                return newTip;
            });
            setAnimationKey(prevKey => prevKey + 1);
        };
        
        getNextTip();
        const tipInterval = setInterval(getNextTip, 5000); // Rotate tip every 5 seconds
        
        return () => clearInterval(tipInterval);
    }, []);

    return (
        <>
            <section id="asistente-ia" className="w-full py-12 md:py-24 lg:py-32 bg-secondary dark:bg-card">
                <div className="container px-4 md:px-6">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Side: Main CTA and Text */}
                        <div className="flex flex-col items-start space-y-6">
                            <div className="w-20 h-20 rounded-full overflow-hidden p-1 bg-primary/20 inline-flex ring-4 ring-primary/30">
                               <Image 
                                 src="https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FImagen%20de%20WhatsApp%202025-08-09%20a%20las%2018.20.39_3c2b6161.jpg?alt=media&token=41ebe34a-f846-41fc-937f-4141f1240ee8"
                                 alt="Avatar de Valeria, la asistente IA"
                                 width={80}
                                 height={80}
                                 className="rounded-full object-cover"
                               />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                                Conoce a Valeria, tu Asistente IA en Mi Red Colombia
                            </h2>
                            <p className="max-w-xl text-muted-foreground md:text-xl/relaxed font-body">
                                Disponible 24/7, Valeria es la inteligencia artificial de Mi Red Colombia lista para ayudarte en cualquier momento. Responde al instante tus dudas sobre visados, trámites, empleo, vivienda y mucho más, para que tu proceso de venir o vivir en España sea más fácil y rápido.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button size="lg" onClick={onOpenChatModal}>
                                    <MessageCircle className="mr-2 h-5 w-5" />
                                    Chatea con Valeria Ahora
                                </Button>
                                 <Button size="lg" variant="outline" onClick={() => setVideoModalOpen(true)}>
                                    <PlayCircle className="mr-2 h-5 w-5" />
                                    Ver Video de Presentación
                                </Button>
                            </div>
                        </div>

                        {/* Right Side: Minimalist Clocks and Tips */}
                         <div className="space-y-4">
                            <div className="border rounded-lg bg-background/50 overflow-hidden">
                                <div className="h-1 flex w-full">
                                    <div className="w-1/2 bg-[#FFCD00]"></div>
                                    <div className="w-1/4 bg-[#003893]"></div>
                                    <div className="w-1/4 bg-[#C70039]"></div>
                                </div>
                                <RealTimeClocks variant="minimal" country="Colombia" />
                            </div>
                             <div className="border rounded-lg bg-background/50 overflow-hidden">
                                <div className="h-1 flex w-full">
                                    <div className="w-1/2 bg-[#AA151B]"></div>
                                    <div className="w-1/2 bg-[#F1BF00]"></div>
                                </div>
                                <RealTimeClocks variant="minimal" country="Spain" />
                            </div>
                            <div className="border rounded-lg p-4 bg-background/50 overflow-hidden relative h-[110px]">
                                <div key={animationKey} className="animate-slide-in-up">
                                    <div className="flex items-start gap-4">
                                        <Lightbulb className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-bold font-headline text-md">Tip del Día</h4>
                                            <p className="text-muted-foreground text-sm mt-1 h-12">
                                                {randomTip || 'Cargando tip...'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
             <VideoModal 
                isOpen={isVideoModalOpen}
                setIsOpen={setVideoModalOpen}
                videoUrl={videoUrl}
                title="Presentación de Valeria, tu Asistente IA"
            />
        </>
    );
}
