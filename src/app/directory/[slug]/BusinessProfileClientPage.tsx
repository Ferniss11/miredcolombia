
'use client';

import { useEffect, useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Globe, Phone, Clock, Star, Users, MapPin, ExternalLink, Beer, Wine, VenetianMask, Euro, Info } from "lucide-react";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import BusinessMap from "@/components/directory/BusinessMap";
import { cn } from "@/lib/utils";
import { PlaceDetails } from "@/lib/types";
import { useChat } from "@/context/ChatContext";

const StarRating = ({ rating }: { rating: number }) => {
    return (
        <div className="flex items-center">
            {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={cn("w-4 h-4", i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')} />
            ))}
        </div>
    );
};

const PriceLevel = ({ level }: { level: number }) => {
    if (!level) return null;
    return (
        <div className="flex items-center">
            {Array.from({ length: 4 }, (_, i) => (
                <Euro key={i} className={cn("w-4 h-4", i < level ? 'text-foreground' : 'text-muted-foreground/30')} />
            ))}
        </div>
    );
}

export default function BusinessProfileClientPage({ initialBusiness }: { initialBusiness: PlaceDetails }) {
  const { setChatContext, openChat, setChatVisible } = useChat();
  const business = initialBusiness;
  const autoplayPlugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
  
  useEffect(() => {
    if (business.id) {
        if (business.isAgentEnabled) {
            setChatContext({
                businessId: business.id,
                businessName: business.displayName,
            });
            setChatVisible(true);
        } else {
            // If the agent is not enabled, hide the chat widget entirely
            setChatVisible(false);
        }
    }

    // Cleanup function to reset context when leaving the page
    return () => {
        setChatContext(null);
        setChatVisible(true); // Make the global widget visible again
    };
  }, [business, setChatContext, setChatVisible]);


  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${business.id}`;

  return (
    <>
    <div className="bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-8">
                <Card className="overflow-hidden sticky top-24 shadow-lg">
                    <CardHeader className="p-0">
                        {business.photos && business.photos.length > 0 ? (
                            <Carousel className="w-full">
                                <CarouselContent>
                                    {business.photos.map((photo, index) => (
                                        <CarouselItem key={index}>
                                            <Image
                                                src={photo.url}
                                                alt={`${business.displayName} - foto ${index + 1}`}
                                                width={600}
                                                height={400}
                                                className="w-full h-64 object-cover"
                                                priority={index === 0}
                                            />
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                {business.photos.length > 1 && <>
                                    <CarouselPrevious className="left-4"/>
                                    <CarouselNext className="right-4"/>
                                </>}
                            </Carousel>
                        ) : (
                            <Image
                                src={"https://placehold.co/600x400.png"}
                                alt={business.displayName}
                                width={600}
                                height={400}
                                data-ai-hint={`${business.category} interior detail`}
                                className="w-full h-64 object-cover"
                            />
                        )}
                    </CardHeader>
                    <CardContent className="p-6">
                    <h1 className="text-3xl font-bold font-headline">{business.displayName}</h1>
                    <p className="text-md text-muted-foreground flex items-center mt-2">
                        <Building className="w-4 h-4 mr-2" />
                        {business.category}
                    </p>
                    
                     <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                        {business.rating && (
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300 font-bold">{business.rating.toFixed(1)}</Badge>
                                <StarRating rating={business.rating} />
                                <span className="text-xs text-muted-foreground">({business.userRatingsTotal} reseñas)</span>
                            </div>
                        )}
                        {business.priceLevel && (
                             <div className="flex items-center gap-2">
                               <PriceLevel level={business.priceLevel}/>
                            </div>
                        )}
                    </div>
                    
                    <Separator className="my-4"/>

                    <div className="space-y-3 text-sm">
                        <div className="flex items-start">
                            <MapPin className="w-4 h-4 mr-3 mt-1 text-muted-foreground flex-shrink-0" />
                            <span>{business.formattedAddress}</span>
                        </div>
                        {business.internationalPhoneNumber && (
                            <div className="flex items-center">
                                <Phone className="w-4 h-4 mr-3 text-muted-foreground" />
                                <span>{business.internationalPhoneNumber}</span>
                            </div>
                        )}
                        {business.website && (
                            <div className="flex items-center">
                                <Globe className="w-4 h-4 mr-3 text-muted-foreground" />
                                <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                                    Visitar sitio web
                                </a>
                            </div>
                        )}
                    </div>

                    <Separator className="my-4"/>

                    <div className="flex gap-2">
                         <Button asChild className="flex-1">
                            <a href={`tel:${business.internationalPhoneNumber}`}>
                                <Phone className="mr-2 h-4 w-4"/> Llamar
                            </a>
                        </Button>
                        <Button asChild variant="outline" className="flex-1">
                            <a href={gmapsUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4"/> Ver en mapa
                            </a>
                        </Button>
                    </div>

                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
                {business.isAgentEnabled && (
                    <Card className="bg-primary/5 border-primary/20">
                         <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <div className="flex-shrink-0">
                                    <div className="p-3 bg-primary/10 rounded-full">
                                        <Star className="w-6 h-6 text-primary" />
                                    </div>
                                </div>
                                <div className="flex-grow">
                                    <h3 className="font-bold">Habla con nuestro Asistente IA</h3>
                                    <p className="text-sm text-muted-foreground">¿Tienes preguntas? Nuestro asistente virtual puede ayudarte a reservar o resolver tus dudas al instante.</p>
                                </div>
                                <Button onClick={openChat}>Iniciar Chat</Button>
                            </div>
                         </CardContent>
                    </Card>
                )}

                {business.isOpenNow !== undefined && (
                    <Card>
                        <CardContent className="p-4">
                            <div className={cn(
                                "flex items-center gap-3 rounded-md p-3",
                                business.isOpenNow ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"
                            )}>
                                <div className={cn(
                                    "w-3 h-3 rounded-full animate-pulse",
                                    business.isOpenNow ? "bg-green-500" : "bg-red-500"
                                )}></div>
                                <div>
                                    <p className={cn(
                                        "font-bold",
                                         business.isOpenNow ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"
                                    )}>
                                        {business.isOpenNow ? "Abierto ahora" : "Cerrado en este momento"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">El horario puede variar. Llama para confirmar.</p>
                                </div>
                                {business.isOpenNow && (
                                     <Button size="sm" className="ml-auto" asChild>
                                        <a href={`tel:${business.internationalPhoneNumber}`}>Reservar Ahora</a>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                 {business.editorialSummary && (
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-xl font-headline"><Info className="w-5 h-5"/> Resumen</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground italic">{business.editorialSummary}</p></CardContent>
                    </Card>
                )}

                {business.openingHours && business.openingHours.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl font-headline">
                                <Clock className="w-5 h-5"/> Horario de Apertura
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                        <ul className="space-y-1 text-muted-foreground">
                            {business.openingHours.map((line, i) => (
                                <li key={i} className="flex justify-between">
                                    <span>{line.split(': ')[0]}:</span>
                                    <span className="font-medium text-foreground">{line.split(': ')[1]}</span>
                                </li>
                            ))}
                        </ul>
                        </CardContent>
                    </Card>
                )}

                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-xl font-headline"><VenetianMask className="w-5 h-5" /> Servicios y Comodidades</CardTitle></CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {business.servesBeer && <Badge variant="outline">Sirve cerveza</Badge>}
                        {business.servesWine && <Badge variant="outline">Sirve vino</Badge>}
                        {business.wheelchairAccessibleEntrance && <Badge variant="outline">Acceso para silla de ruedas</Badge>}
                        {!business.servesBeer && !business.servesWine && !business.wheelchairAccessibleEntrance && <p className="text-sm text-muted-foreground">No hay información de servicios adicionales.</p>}
                    </CardContent>
                </Card>

                {business.geometry && (
                    <Card>
                        <CardHeader><CardTitle className="text-xl font-headline">Ubicación</CardTitle></CardHeader>
                        <CardContent>
                            <div className="aspect-video w-full rounded-lg overflow-hidden">
                                <BusinessMap center={business.geometry.location} name={business.displayName} />
                            </div>
                        </CardContent>
                    </Card>
                )}

                 {business.reviews && business.reviews.length > 0 && (
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl font-headline">
                                <Users className="w-5 h-5"/> Reseñas de Clientes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                           <Carousel 
                             opts={{ loop: true, align: "start" }} 
                             plugins={[autoplayPlugin.current]}
                             className="w-full"
                           >
                            <CarouselContent className="sm:-ml-2">
                                {business.reviews.map((review, i) => (
                                    <CarouselItem key={i} className="sm:basis-1/2 lg:basis-1/3 sm:pl-2">
                                         <div className="p-1">
                                             <Card className="h-full">
                                                <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                                                     <Avatar>
                                                        <AvatarImage src={review.profile_photo_url} alt={review.author_name} />
                                                        <AvatarFallback>{review.author_name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold">{review.author_name}</p>
                                                        <p className="text-xs text-muted-foreground">{review.relative_time_description}</p>
                                                    </div>
                                                    <StarRating rating={review.rating} />
                                                    <p className="text-sm text-muted-foreground italic h-24 overflow-y-auto">"{review.text}"</p>
                                                </CardContent>
                                             </Card>
                                         </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="hidden sm:flex" />
                            <CarouselNext className="hidden sm:flex" />
                           </Carousel>
                        </CardContent>
                    </Card>
                 )}

            </div>
        </div>
        </div>
    </div>
    </>
  );
}
