'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

const RealTimeClocks = () => {
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
              second: '2-digit',
              hour12: true,
            }),
            spain: new Date().toLocaleTimeString('es-ES', {
              timeZone: 'Europe/Madrid',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }),
        });
    }

    updateClocks();
    const timer = setInterval(updateClocks, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <Card className="text-center shadow-lg">
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
            <Card className="text-center shadow-lg">
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
        <Card className="max-w-2xl mx-auto mt-8">
             <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                    <div className="text-2xl pt-1">💡</div>
                    <div>
                        <h4 className="font-bold font-headline text-lg">Tip de Horarios</h4>
                        <p className="text-muted-foreground mt-1">
                            Diferencia horaria: Madrid está 6-7 horas adelante de Bogotá dependiendo del horario de verano. El mejor momento para llamadas familiares es entre las 14:00-20:00 hora de Madrid (8:00-14:00 hora de Bogotá).
                        </p>
                    </div>
                </div>
             </CardContent>
        </Card>
    </div>
  );
};

export default RealTimeClocks;
