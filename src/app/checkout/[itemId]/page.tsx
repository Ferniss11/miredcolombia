
'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { migrationPackages, migrationServices, valeriaPlans } from '@/lib/placeholder-data';
import StripeCheckoutForm from '@/components/checkout/StripeCheckoutForm';
import { Loader2 } from 'lucide-react';

function CheckoutPageContent() {
    const params = useParams();
    const itemId = Array.isArray(params.itemId) ? params.itemId[0] : params.itemId;
    
    const allItems = [...migrationPackages, ...migrationServices, ...valeriaPlans];
    const item = allItems.find(i => i.id === itemId);

    if (!item) {
        return (
            <Card className="max-w-xl mx-auto">
                <CardHeader>
                    <CardTitle>Producto no encontrado</CardTitle>
                    <CardDescription>No pudimos encontrar el producto que estás buscando.</CardDescription>
                </CardHeader>
            </Card>
        );
    }
    
    return (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
                <h2 className="text-2xl font-bold font-headline">Completa tu Compra</h2>
                <Card>
                    <CardHeader>
                        <CardTitle>{item.name}</CardTitle>
                        <CardDescription>{item.description || "Plan de suscripción de Valeria"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {typeof item.price === 'number' ? (
                            <p className="text-2xl font-bold">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.price)}</p>
                        ) : (
                             <p className="text-2xl font-bold">{item.price}</p>
                        )}
                        
                    </CardContent>
                </Card>
            </div>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Información de Pago</CardTitle>
                     <CardDescription>Tu pago es procesado de forma segura a través de Stripe.</CardDescription>
                </CardHeader>
                <CardContent>
                   <StripeCheckoutForm item={{...item, type: 'package'}} />
                </CardContent>
            </Card>
        </div>
    );
}

export default function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
        <Suspense fallback={<div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
            <CheckoutPageContent />
        </Suspense>
    </div>
  );
}
