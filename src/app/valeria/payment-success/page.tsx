
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, CheckCircle } from 'lucide-react';

// A simple confetti component that is safe from hydration errors
const Confetti = () => {
    const [confettiPieces, setConfettiPieces] = useState<React.CSSProperties[]>([]);

    useEffect(() => {
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


export default function PaymentSuccessPage() {
    const { forceTokenRefresh, claims } = useAuth();
    const router = useRouter();
    const [status, setStatus] = useState('Verificando pago y refrescando sesión...');

    // Step 1: Trigger token refresh on component mount
    useEffect(() => {
        console.log("PaymentSuccessPage: Forcing token refresh...");
        forceTokenRefresh();
    }, [forceTokenRefresh]);

    // Step 2: React to claims changes and redirect
    useEffect(() => {
        if (claims) {
            console.log("PaymentSuccessPage: Claims updated", claims);
            const plan = claims?.valeria_plan;
            if (plan === 'valeria_premium' || plan === 'valeria_pro') {
                setStatus('¡Todo listo! Redirigiendo a tu panel...');
                // Use a timeout to let the user see the success message
                setTimeout(() => {
                    router.replace('/dashboard/valeria');
                }, 1500);
            } else {
                 console.log(`PaymentSuccessPage: Plan is '${plan}', waiting for 'valeria_premium' or 'valeria_pro'.`);
            }
        } else {
            console.log("PaymentSuccessPage: Waiting for claims...");
        }
    }, [claims, router]);


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden">
            <Confetti />
            <div className="text-center p-8 bg-background/80 backdrop-blur-sm rounded-lg shadow-2xl relative">
                <CheckCircle className="mx-auto h-24 w-24 text-green-500" />
                <h1 className="mt-6 text-4xl font-bold font-headline text-foreground">¡Pago Exitoso!</h1>
                <p className="mt-4 text-lg text-muted-foreground">Gracias por tu compra. Estamos preparando tu acceso.</p>
                <div className="mt-8 flex items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>{status}</span>
                </div>
            </div>
        </div>
    );
}
