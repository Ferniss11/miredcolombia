
'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { migrationPackages, migrationServices } from '@/lib/placeholder-data';
import StripeCheckoutForm from '@/components/checkout/StripeCheckoutForm';
import { Loader2, Check, Lock } from 'lucide-react';
import { FaCcVisa, FaCcMastercard, FaCcStripe } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


function CheckoutPageContent() {
    const params = useParams();
    const { user, loading } = useAuth();

    const itemId = Array.isArray(params.itemId) ? params.itemId[0] : params.itemId;
    
    // Combine packages and services to find the item
    const allItems = [...migrationPackages, ...migrationServices];
    const item = allItems.find(i => i.id === itemId);

    if (loading) {
        return (
             <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Verificando tu sesión...</p>
            </div>
        )
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
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
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
            
            {/* Right side: Auth or Payment */}
            <div className="lg:sticky top-24 self-start">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lock className="w-5 h-5"/>
                          {user ? 'Paso 2: Pago Seguro' : 'Paso 1: Accede a tu cuenta'}
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
                        {user ? (
                             <StripeCheckoutForm item={{...item, type: 'package', price: typeof item.price === 'number' ? item.price : 0}} />
                        ) : (
                             <Tabs defaultValue="login" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                                    <TabsTrigger value="signup">Crear Cuenta</TabsTrigger>
                                </TabsList>
                                <TabsContent value="login">
                                    <p className="text-sm text-muted-foreground text-center my-4">Inicia sesión para continuar con tu compra.</p>
                                    <LoginForm />
                                </TabsContent>
                                <TabsContent value="signup">
                                    <p className="text-sm text-muted-foreground text-center my-4">Crea una cuenta para guardar tu compra.</p>
                                    <SignUpForm />
                                </TabsContent>
                            </Tabs>
                        )}
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
