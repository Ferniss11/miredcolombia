
'use client';

import React from 'react';
import { CheckCircle, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// A simple confetti component that is safe from hydration errors
const Confetti = () => {
    const [confettiPieces, setConfettiPieces] = React.useState<React.CSSProperties[]>([]);

    React.useEffect(() => {
        // Generate confetti styles only on the client side
        const newPieces = Array.from({ length: 150 }).map(() => ({
            left: `${Math.random() * 100}%`,
            top: `${-20 + Math.random() * -80}%`,
            animation: `fall ${2 + Math.random() * 2}s ${Math.random() * 3}s linear infinite`,
            '--color': `hsl(${Math.random() * 360}, 70%, 60%)`,
        } as React.CSSProperties));
        setConfettiPieces(newPieces);
    }, []);

    if (confettiPieces.length === 0) {
        return null; // Render nothing on the server and initial client render
    }

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {confettiPieces.map((style, i) => (
                <div
                    key={i}
                    className="absolute w-2 h-2 bg-[--color] rounded-full opacity-70"
                    style={style}
                ></div>
            ))}
            <style jsx>{`
                @keyframes fall {
                    to {
                        transform: translateY(100vh) rotate(600deg);
                    }
                }
            `}</style>
        </div>
    );
};


export default function OneTimePaymentSuccessPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] bg-background relative overflow-hidden py-12">
            <Confetti />
            <div className="text-center p-8 bg-background/80 backdrop-blur-sm rounded-lg shadow-2xl relative max-w-2xl mx-auto">
                <PartyPopper className="mx-auto h-24 w-24 text-primary" />
                <h1 className="mt-6 text-4xl font-bold font-headline text-foreground">¡Pago Realizado con Éxito!</h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Hemos recibido tu solicitud correctamente. Un asesor de nuestro equipo se pondrá en contacto contigo en las próximas 24 horas laborables para agendar tu consultoría y dar los siguientes pasos.
                </p>
                 <p className="mt-2 text-sm text-muted-foreground">
                    Revisa tu correo electrónico, te hemos enviado un recibo de tu compra.
                </p>
                <div className="mt-8">
                     <Button asChild>
                        <Link href="/">Volver a la Página Principal</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
