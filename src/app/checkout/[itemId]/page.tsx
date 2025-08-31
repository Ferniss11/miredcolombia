
'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { migrationPackages, migrationServices, valeriaPlans } from '@/lib/placeholder-data';
import StripeCheckoutForm from '@/components/checkout/StripeCheckoutForm';
import { Loader2, Check } from 'lucide-react';

// SVGs for payment icons for better performance and no new dependencies
const VisaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" viewBox="0 0 38 24" role="img" aria-labelledby="pi-visa"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"></path><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"></path><path d="M28.8 10.1c-.1-.3-.3-.5-.5-.7-.2-.2-.5-.3-.8-.3-.5 0-.9.2-1.2.5-.3.2-.5.6-.6.9-.1.3-.1.6.1.9.2.3.5.5.9.5.6 0 1.1-.2 1.5-.6.4-.3.6-.7.6-1.1 0-.2 0-.4-.1-.5zm-14.3-.4c.3-.4.7-.6 1.2-.6.5 0 .9.2 1.2.5.3.3.5.6.5.9 0 .4-.2.7-.5.9-.3.2-.7.3-1.1.3-.5 0-.9-.2-1.2-.5s-.5-.6-.5-.9c0-.3.2-.6.4-.7zm-3.5 6.5c.2-.2.5-.3.8-.3.4 0 .7.1.9.3.2.2.3.4.3.7 0 .3-.1.5-.3.7-.2.2-.5.3-.8.3-.4 0-.7-.1-.9-.3-.2-.2-.3-.4-.3-.7 0-.3.1-.5.3-.7zm-3.7-3.2c.3-.4.7-.6 1.2-.6.5 0 .9.2 1.2.5.3.3.5.6.5.9 0 .4-.2.7-.5.9-.3.2-.7.3-1.1.3-.5 0-.9-.2-1.2-.5s-.5-.6-.5-.9c0-.3.2-.6.4-.7zm18.4 3.2c.2-.2.5-.3.8-.3.4 0 .7.1.9.3.2.2.3.4.3.7 0 .3-.1.5-.3.7-.2.2-.5.3-.8.3-.4 0-.7-.1-.9-.3-.2-.2-.3-.4-.3-.7 0-.3.1-.5.3-.7z" fill="#142688"></path></svg>

const MastercardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" viewBox="0 0 38 24" role="img" aria-labelledby="pi-mastercard"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"></path><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"></path><circle fill="#EB001B" cx="15" cy="12" r="7"></circle><circle fill="#F79E1B" cx="23" cy="12" r="7"></circle><path fill="#FF5F00" d="M22 12c0-2.4-1.2-4.5-3-5.7-1.8 1.3-3 3.4-3 5.7s1.2 4.5 3 5.7c1.8-1.2 3-3.3 3-5.7z"></path></svg>

const StripeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="38" height="24" viewBox="0 0 48 48"><path fill="#635bff" d="M24,48A24,24,0,1,1,48,24,24,24,0,0,1,24,48ZM13,24.38a4.32,4.32,0,0,0,4.32,4.32H27.5a1.24,1.24,0,1,0,0-2.48H17.33A1.84,1.84,0,1,1,19.17,23a1.24,1.24,0,1,0,2.44-.4A4.32,4.32,0,0,0,13,24.38Z"/><path fill="#635bff" d="M34.52,24a4.32,4.32,0,0,0-4.32-4.32H20a1.24,1.24,0,0,0,0,2.48H30.19a1.84,1.84,0,0,1,0,3.68H27.6a1.24,1.24,0,1,0,0,2.48h2.59a1.84,1.84,0,1,1-1.84,1.84,1.24,1.24,0,1,0-2.48,0A4.32,4.32,0,0,0,34.52,24Z"/></svg>

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
            <div className="lg:sticky top-24 self-start">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Información de Pago</CardTitle>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                            <span>Tu pago es procesado de forma segura.</span>
                            <div className="flex items-center gap-2">
                                <VisaIcon />
                                <MastercardIcon />
                                <StripeIcon />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                    <StripeCheckoutForm item={{...item, type: 'package', price: typeof item.price === 'number' ? item.price : 0}} />
                    </CardContent>
                </Card>
            </div>
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
