
'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { migrationPackages, migrationServices, valeriaPlans } from '@/lib/placeholder-data';
import StripeCheckoutForm from '@/components/checkout/StripeCheckoutForm';
import { Loader2, Check } from 'lucide-react';

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
    
     const displayPrice = typeof item.price === 'number'
        ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.price)
        : item.price;


    return (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="space-y-6">
                <h2 className="text-3xl font-bold font-headline">Completa tu Compra</h2>
                <Card className="bg-secondary/50">
                    <CardHeader>
                        <CardTitle className="text-2xl">{item.name}</CardTitle>
                        <CardDescription>{(item as any).description || `Suscripción al ${item.name}`}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold mb-4">{displayPrice} <span className="text-sm font-normal text-muted-foreground">{(item as any).priceDetails}</span></p>
                        {item.features && item.features.length > 0 && (
                             <ul className="space-y-3">
                                {item.features.map((feature, index) => (
                                <li key={index} className="flex items-start">
                                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span>{feature}</span>
                                </li>
                                ))}
                            </ul>
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
                   <StripeCheckoutForm item={{...item, type: 'package', price: typeof item.price === 'number' ? item.price : 0}} />
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
