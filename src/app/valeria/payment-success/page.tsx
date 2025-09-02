
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
    const [status, setStatus] = useState('Verificando pago...');

    useEffect(() => {
        const verifyAndRedirect = async () => {
            setStatus('Refrescando tu sesión...');
            await forceTokenRefresh();

            // After refresh, check claims directly. The context will update.
            // We give it a small delay to allow context to propagate.
            setTimeout(() => {
                 setStatus('Accediendo a tu plan...');
                 // The claims object from useAuth will be updated now
                 // We re-read it inside the timeout to get the latest value.
                 const latestClaims = claims;
                 const plan = latestClaims?.valeria_plan;

                 if (plan === 'colombia' || plan === 'espana') {
                    router.replace('/dashboard/valeria');
                 } else {
                    // Fallback in case claims didn't propagate in time
                    // This could be improved with a more robust state management
                    console.warn("Claim not available immediately after refresh. Retrying redirection.");
                    router.replace('/dashboard/valeria');
                 }
            }, 2500); // Increased delay to ensure context updates
        };

        verifyAndRedirect();
    }, [forceTokenRefresh, router, claims]);

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

