
'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { useTransition, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { searchBusinessesOnGoogleAction, getBusinessDetailsForVerificationAction, verifyAndLinkBusinessAction, unlinkBusinessFromAdvertiserAction } from "@/lib/directory-actions";

import type { BusinessProfile, PlaceDetails, UserProfile } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Search, Link as LinkIcon, Building, UserCheck, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";


const businessProfileSchema = z.object({
    businessName: z.string().min(2, { message: "El nombre del negocio debe tener al menos 2 caracteres." }),
    address: z.string().min(5, { message: "La dirección es obligatoria." }),
    phone: z.string().min(7, { message: "El número de teléfono es obligatorio." }),
    website: z.string().url({ message: "Debe ser una URL válida." }).or(z.literal("")).optional(),
    description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
});

type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>;

type Place = {
    id: string;
    displayName: string;
    formattedAddress: string;
};

// Component for linking a business
function BusinessLinker({ userProfile, onBusinessLinked }: { userProfile: UserProfile, onBusinessLinked: (details: PlaceDetails) => void }) {
    const { toast } = useToast();
    const [isSearching, startSearchTransition] = useTransition();
    const [isLinking, startLinkingTransition] = useTransition();
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Place[] | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [verificationDetails, setVerificationDetails] = useState<{ partialPhone: string, placeId: string } | null>(null);
    const [phoneInput, setPhoneInput] = useState('');

    const handleSearch = () => {
        startSearchTransition(async () => {
            const result = await searchBusinessesOnGoogleAction(query);
            if (result.error) {
                toast({ variant: 'destructive', title: "Error en la Búsqueda", description: result.error });
            } else {
                setSearchResults(result.places || []);
            }
        });
    };

    const handleSelectBusiness = async (place: Place) => {
        setSelectedPlace(place);
        const result = await getBusinessDetailsForVerificationAction(place.id);
        if (result.error) {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        } else if (result.details) {
            setVerificationDetails({ partialPhone: result.details.partialPhone, placeId: place.id });
        }
    };
    
    const handleVerifyAndLink = () => {
        if (!verificationDetails) return;
        startLinkingTransition(async () => {
            const result = await verifyAndLinkBusinessAction(userProfile.uid, verificationDetails.placeId, phoneInput);
             if (result.error) {
                toast({ variant: 'destructive', title: "Error de Verificación", description: result.error });
            } else if (result.success && result.businessDetails) {
                toast({ title: "¡Éxito!", description: "Negocio vinculado. Un administrador revisará tu solicitud." });
                onBusinessLinked(result.businessDetails);
            }
        });
    };

    if (verificationDetails) {
        return (
            <div className="space-y-4">
                <h3 className="font-semibold">Paso 2: Verifica que eres el propietario</h3>
                <p className="text-sm text-muted-foreground">Para asegurarnos de que eres el propietario de <strong>{selectedPlace?.displayName}</strong>, por favor, introduce el número de teléfono completo. Solo los últimos dígitos son visibles por seguridad.</p>
                <p className="text-lg font-mono p-2 bg-muted rounded-md text-center">{verificationDetails.partialPhone}</p>
                <Input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="Introduce el número completo" />
                <div className="flex justify-between">
                     <Button variant="outline" onClick={() => setVerificationDetails(null)}>Atrás</Button>
                     <Button onClick={handleVerifyAndLink} disabled={isLinking}>
                        {isLinking && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Verificar y Vincular
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Label htmlFor="business-search">Busca tu negocio por nombre y ciudad</Label>
            <div className="flex gap-2">
                <Input id="business-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ej: Arepas El Sabor, Madrid"/>
                <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search />}
                </Button>
            </div>
            {searchResults && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.length > 0 ? searchResults.map(place => (
                        <div key={place.id} className="p-2 border rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{place.displayName}</p>
                                <p className="text-xs text-muted-foreground">{place.formattedAddress}</p>
                            </div>
                            <Button size="sm" onClick={() => handleSelectBusiness(place)}>Seleccionar</Button>
                        </div>
                    )) : <p className="text-sm text-muted-foreground text-center">No se encontraron resultados.</p>}
                </div>
            )}
        </div>
    );
}


// Main page component
export default function AdvertiserProfilePage() {
    const { user, userProfile, loading, refreshUserProfile } = useAuth();
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const form = useForm<BusinessProfileFormValues>({
        resolver: zodResolver(businessProfileSchema),
        defaultValues: {
            businessName: "",
            address: "",
            phone: "",
            website: "",
            description: "",
        },
    });
    
    useEffect(() => {
        if (userProfile?.businessProfile) {
            form.reset({
                businessName: userProfile.businessProfile.businessName || "",
                address: userProfile.businessProfile.address || "",
                phone: userProfile.businessProfile.phone || "",
                website: userProfile.businessProfile.website || "",
                description: userProfile.businessProfile.description || "",
            });
        }
    }, [userProfile, form]);
    

    const handleBusinessLinked = async (details: PlaceDetails) => {
        await refreshUserProfile();
        form.reset({
            businessName: details.displayName,
            address: details.formattedAddress,
            phone: details.internationalPhoneNumber || details.formattedPhoneNumber || '',
            website: details.website || '',
            description: userProfile?.businessProfile?.description || '', // Keep existing description
        });
    };
    
    const handleUnlink = async () => {
        if (!user || !userProfile?.businessProfile?.placeId) return;
        if (!confirm("¿Estás seguro de que quieres desvincular este negocio? Perderás los beneficios de la suscripción asociada.")) {
            return;
        }
        startTransition(async () => {
            const result = await unlinkBusinessFromAdvertiserAction(user.uid, userProfile.businessProfile.placeId!);
            if (result.error) {
                toast({ variant: 'destructive', title: "Error", description: result.error });
            } else {
                toast({ title: "Éxito", description: "Negocio desvinculado." });
                await refreshUserProfile();
                 form.reset({ businessName: "", address: "", phone: "", website: "", description: "" });
            }
        });
    }

    async function onSubmit(data: BusinessProfileFormValues) {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para actualizar tu perfil.' });
            return;
        }

        startTransition(async () => {
            try {
                const idToken = await user.getIdToken();
                const response = await fetch(`/api/users/${user.uid}/business-profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`,
                    },
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    const apiError = await response.json();
                    throw new Error(apiError.error?.message || 'Error del servidor al actualizar.');
                }

                toast({ title: 'Éxito', 'description': '¡Tu perfil de negocio ha sido actualizado!' });
                await refreshUserProfile();
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error al actualizar', description: error.message });
            }
        });
    }

    if (loading || !userProfile) {
        return <div><Loader2 className="animate-spin" /></div>;
    }

    const isBusinessLinked = !!userProfile?.businessProfile?.placeId;
    const verificationStatus = userProfile?.businessProfile?.verificationStatus;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Perfil del Negocio</h1>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LinkIcon className={cn("h-6 w-6", isBusinessLinked ? 'text-green-500' : 'text-muted-foreground')} />
                        Conexión con Google
                    </CardTitle>
                    <CardDescription>
                        {isBusinessLinked
                            ? "Tu perfil está vinculado a un negocio de Google. Esto te permite acceder a beneficios y mantiene tu información sincronizada."
                            : "Vincula tu perfil con tu negocio en Google para mejorar tu visibilidad y gestionar tu información fácilmente."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isBusinessLinked ? (
                        <div>
                             <Alert variant={verificationStatus === 'approved' ? 'default' : 'destructive'} className={cn(verificationStatus === 'approved' && 'border-green-300 bg-green-50 text-green-900')}>
                                {verificationStatus === 'approved' ? <UserCheck className="h-4 w-4 !text-green-700" /> : <XCircle className="h-4 w-4" />}
                                <AlertTitle>{verificationStatus === 'approved' ? "Negocio Verificado y Vinculado" : "Vinculación Pendiente de Aprobación"}</AlertTitle>
                                <AlertDescription>
                                    {verificationStatus === 'approved'
                                     ? `Estás vinculado a ${userProfile?.businessProfile?.businessName}.`
                                     : `Un administrador necesita aprobar la vinculación con ${userProfile?.businessProfile?.businessName}.`}
                                </AlertDescription>
                            </Alert>
                             <Button variant="link" className="text-destructive px-0 mt-2" onClick={handleUnlink} disabled={isPending}>
                                Desvincular negocio
                            </Button>
                        </div>
                    ) : (
                       <BusinessLinker userProfile={userProfile!} onBusinessLinked={handleBusinessLinked} />
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Información Pública de tu Negocio</CardTitle>
                    <CardDescription>
                        {isBusinessLinked
                         ? "Esta información se sincronizó desde Google. Puedes editarla si es necesario."
                         : "Completa tu perfil para que los clientes puedan encontrarte. Esta información aparecerá en nuestro directorio."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="businessName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre del Negocio</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Mi Negocio increíble" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="space-y-2">
                                    <Label>Nombre de Contacto</Label>
                                    <Input value={userProfile?.name || ''} readOnly disabled />
                                </div>
                            </div>
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dirección</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Calle Falsa 123, Madrid" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número de Teléfono</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+34 600 000 000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sitio Web</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://minegocio.es" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            </div>
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descripción del Negocio</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Describe tu negocio y lo que ofreces..." rows={5} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar Cambios
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
