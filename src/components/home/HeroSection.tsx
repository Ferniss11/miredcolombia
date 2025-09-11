import { Button } from "@/components/ui/button";
import { Package, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useChat } from "@/context/ChatContext";


export default function HeroSection() {
    const { openChat } = useChat();

    return (
        <section className="relative w-full h-screen flex items-center justify-center text-white">
            <Image
                src="https://images.unsplash.com/photo-1539037116277-4db20889f2d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080"
                layout="fill"
                objectFit="cover"
                alt="Madrid cityscape"
                data-ai-hint="madrid cityscape"
                className="absolute inset-0 -z-10"
                priority
            />
            <div className="absolute inset-0 bg-black/60 z-0" />
            <div className="relative z-10 container px-4 md:px-6 text-center flex flex-col items-center">
                <Image
                  src="https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FLOGO.png?alt=media&token=86f8e9f6-587a-4cb6-bae1-15b0c815f22b"
                  width={100}
                  height={100}
                  alt="Mi Red Colombia Logo"
                  className="mb-6 p-2 rounded-2xl shadow-lg"
                />
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-headline">
                    Tu puente de Colombia a España: empleo, vivienda y papeles en regla sin perderte en el camino.
                </h1>
                <p className="mt-4 max-w-3xl text-lg md:text-xl text-gray-200 font-body">
                    Con Valeria (IA) y nuestro equipo tendrás acompañamiento real en cada paso. Servicios completos de viaje, onboarding y consultoría.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row w-full max-w-md">
                    <Button asChild size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base">
                        <Link href="/packs">
                            <Package className="mr-2 h-5 w-5" />
                            Ver Packs de servicios
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white bg-transparent hover:bg-white/10 px-8 py-6 text-base" onClick={openChat}>
                        <MessageCircle className="mr-2 h-5 w-5" />
                        Habla con Valeria ahora
                    </Button>
                </div>
            </div>
        </section>
    );
}
