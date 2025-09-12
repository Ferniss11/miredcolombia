
'use client';

import { Button } from "@/components/ui/button";
import { Bot, MessageCircle, Package } from "lucide-react";
import Image from 'next/image';
import Link from "next/link";

export default function AiAssistantSection({ onOpenChatModal }: { onOpenChatModal: () => void }) {

    return (
        <section id="asistente-ia" className="w-full py-12 md:py-24 lg:py-32 bg-secondary dark:bg-card">
            <div className="container px-4 md:px-6 max-w-6xl">
                <div className="mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Side: Image */}
                    <div className="flex justify-center items-center">
                        <div className="relative">
                            <Image 
                                src="https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FImagen%20de%20WhatsApp%202025-08-09%20a%20las%2018.20.39_3c2b6161.jpg?alt=media&token=41ebe34a-f846-41fc-937f-4141f1240ee8"
                                alt="Avatar de Valeria, la asistente IA"
                                width={200}
                                height={200}
                                className="rounded-full object-cover border-4 border-primary/30 shadow-2xl"
                            />
                        </div>
                    </div>

                    {/* Right Side: Main CTA and Text */}
                    <div className="flex flex-col items-start space-y-6">
                        <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">Asistente IA</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                            Con Valeria nunca estarás solo
                        </h2>
                        <p className="max-w-xl text-muted-foreground md:text-xl/relaxed font-body">
                            Tu asesora IA 24/7. Gratis para empezar, y con planes Premium que incluyen alertas de empleo, vivienda y guías exclusivas para que tu proceso sea aún más fácil.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button size="lg" variant="outline" onClick={onOpenChatModal}>
                                <MessageCircle className="mr-2 h-5 w-5" />
                                Probar Gratis
                            </Button>
                             <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                <Link href="/valeria">
                                    <Package className="mr-2 h-5 w-5" />
                                    Ver planes de Valeria
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
