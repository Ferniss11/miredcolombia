
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealTimeClocksProps {
    variant?: 'default' | 'minimal';
}

const RealTimeClocks = ({ variant = 'default' }: RealTimeClocksProps) => {
  const [time, setTime] = useState({
    colombia: '',
    spain: '',
  });

  useEffect(() => {
    const updateClocks = () => {
        setTime({
            colombia: new Date().toLocaleTimeString('es-CO', {
              timeZone: 'America/Bogota',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            spain: new Date().toLocaleTimeString('es-ES', {
              timeZone: 'Europe/Madrid',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }),
        });
    }

    updateClocks();
    const timer = setInterval(updateClocks, 1000);

    return () => clearInterval(timer);
  }, []);
  
  if (variant === 'minimal') {
    return (
        <div className='space-y-4'>
            <div className="border rounded-lg p-4 bg-background/50">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🇨🇴</span>
                        <div>
                            <p className="font-semibold text-sm">Colombia</p>
                            <p className="text-xs text-muted-foreground">(COT)</p>
                        </div>
                    </div>
                    <p className="text-lg font-mono font-semibold tracking-wider">
                        {time.colombia || '...'}
                    </p>
                </div>
            </div>
             <div className="border rounded-lg p-4 bg-background/50">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🇪🇸</span>
                        <div>
                            <p className="font-semibold text-sm">España</p>
                            <p className="text-xs text-muted-foreground">(CET)</p>
                        </div>
                    </div>
                    <p className="text-lg font-mono font-semibold tracking-wider">
                        {time.spain || '...'}
                    </p>
                </div>
            </div>
        </div>
    )
  }

  return (
    <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <Card className="text-center shadow-lg overflow-hidden">
                <div className="h-1.5 flex w-full">
                    <div className="w-1/2 bg-[#FFCD00]"></div>
                    <div className="w-1/4 bg-[#003893]"></div>
                    <div className="w-1/4 bg-[#C70039]"></div>
                </div>
                <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2 text-2xl font-headline">
                        <Clock className="w-6 h-6"/>
                        Hora en Colombia
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl md:text-5xl font-bold font-mono tracking-wider">
                        {time.colombia || 'Cargando...'}
                    </p>
                     <p className="text-sm text-muted-foreground mt-2">
                        (COT)
                    </p>
                </CardContent>
            </Card>
            <Card className="text-center shadow-lg overflow-hidden">
                <div className="h-1.5 flex w-full">
                    <div className="w-1/4 bg-[#AA151B]"></div>
                    <div className="w-1/2 bg-[#F1BF00]"></div>
                    <div className="w-1/4 bg-[#AA151B]"></div>
                </div>
                <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2 text-2xl font-headline">
                        <Clock className="w-6 h-6"/>
                        Hora en España
                    </CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-4xl md:text-5xl font-bold font-mono tracking-wider">
                        {time.spain || 'Cargando...'}
                    </p>
                     <p className="text-sm text-muted-foreground mt-2">
                        (CET/CEST)
                    </p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
};

export default RealTimeClocks;
