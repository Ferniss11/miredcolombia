

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';

const RealTimeClocks = () => {
  const [time, setTime] = useState({
    colombia: '--:--',
    spain: '--:--',
  });
  const [isClient, setIsClient] = useState(false);

  const updateClocks = useCallback(() => {
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
  }, []); // El array vacío asegura que la función no se recree

  useEffect(() => {
    setIsClient(true);
    updateClocks(); // Initial update
    const timer = setInterval(updateClocks, 1000 * 30); // Update every 30 seconds

    return () => clearInterval(timer);
  }, [updateClocks]); // Ahora la dependencia es estable

  if (!isClient) {
    // Render a lightweight, static placeholder on the server.
    return (
      <div className="flex justify-around items-center h-full text-muted-foreground p-4 border rounded-lg bg-background/50 shadow-lg">
          <div className="text-center">
              <h4 className="font-semibold text-sm">Colombia</h4>
              <p className="font-mono text-lg">--:--</p>
          </div>
           <div className="text-center">
              <h4 className="font-semibold text-sm">España</h4>
              <p className="font-mono text-lg">--:--</p>
          </div>
      </div>
    );
  }

  // Render the full component only on the client side.
  return (
    <div className="border rounded-lg p-4 bg-background/50 shadow-lg h-full">
        <div className="h-1 flex w-full rounded-t-md overflow-hidden absolute top-0 left-0 right-0">
            <div className="w-1/2 bg-[#FFCD00]" />
            <div className="w-1/4 bg-[#003893]" />
            <div className="w-1/4 bg-[#C70039]" />
        </div>
        <div className="h-1 flex w-full rounded-t-md overflow-hidden absolute top-0 left-0 right-0" style={{ transform: 'rotate(180deg)' }}>
            <div className="w-1/4 bg-[#AA151B]" />
            <div className="w-1/2 bg-[#F1BF00]" />
            <div className="w-1/4 bg-[#AA151B]" />
        </div>

        <div className="flex justify-around items-center h-full pt-2">
            <div className="text-center">
                <h4 className="font-semibold text-sm">Colombia</h4>
                <p className="font-mono text-xl font-bold tracking-wider">{time.colombia}</p>
                <p className="text-xs text-muted-foreground">(COT)</p>
            </div>
            <div className="text-center">
                <h4 className="font-semibold text-sm">España</h4>
                <p className="font-mono text-xl font-bold tracking-wider">{time.spain}</p>
                <p className="text-xs text-muted-foreground">(CET)</p>
            </div>
        </div>
    </div>
  );
};

export default RealTimeClocks;
