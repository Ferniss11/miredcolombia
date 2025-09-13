
'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { migrationPackages, migrationServices } from '@/lib/placeholder-data';
import StripeCheckoutForm from '@/components/checkout/StripeCheckoutForm';
import { Loader2, Lock } from 'lucide-react';
import { FaCcVisa, FaCcMastercard, FaCcStripe } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';


function CheckoutPageContent() {
    const params = useParams();
    const { user, userProfile, loading } = useAuth();

    const itemId = Array.isArray(params.itemId) ? params.itemId[0] : params.itemId;
    
    const allItems = [...migrationPackages, ...migrationServices];
    const item = allItems.find(i => i.id === itemId);

    if (loading) {
        return <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>;
    }

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
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Left side: Item Details */}
            <div className="space-y-6">
                <h2 className="text-3xl font-bold font-headline">Completa tu Compra</h2>
                <Card className="bg-secondary/50">
                    <CardHeader>
                        <CardTitle className="text-2xl">{item.name}</CardTitle>
                        <CardDescription>{(item as any).description || `Compra de ${item.name}`}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold mb-4">{displayPrice}</p>
                    </CardContent>
                </Card>
            </div>
            
            {/* Right side: Payment Form */}
            <div className="lg:sticky top-24 self-start">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lock className="w-5 h-5"/>
                          Pago Seguro
                        </CardTitle>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                            <span>Tu pago es procesado de forma segura con Stripe.</span>
                            <div className="flex items-center gap-2">
                                <FaCcVisa className="h-6 w-6 text-blue-600" />
                                <FaCcMastercard className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <StripeCheckoutForm 
                            item={{...item, type: 'package', price: typeof item.price === 'number' ? item.price : 0}}
                            prefilledUser={user ? { name: userProfile?.name || '', email: user.email || '', phone: userProfile?.businessProfile?.phone } : undefined}
                         />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
        <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
            <CheckoutPageContent />
        </Suspense>
    </div>
  );
}
