
import { getPublicBusinessDetailsAction } from "@/lib/directory-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Globe, Mail, Phone, Clock, Star, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";

export default async function BusinessProfilePage({ params }: { params: { slug: string } }) {
  // The slug is now the Place ID
  const { business, error } = await getPublicBusinessDetailsAction(params.slug);

  if (error || !business) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Left Sidebar */}
        <div className="md:col-span-1">
          <Card className="overflow-hidden sticky top-24 shadow-lg">
             <CardHeader className="p-0">
                <Image
                    src={business.photos?.[0]?.url || "https://placehold.co/600x400.png"}
                    alt={business.displayName}
                    width={600}
                    height={400}
                    data-ai-hint={`${business.category} interior detail`}
                    className="w-full h-64 object-cover"
                />
            </CardHeader>
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold font-headline">{business.displayName}</h1>
              <p className="text-md text-muted-foreground flex items-center mt-2">
                <Building className="w-4 h-4 mr-2" />
                {business.category}
              </p>
              
               {business.rating && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">{business.rating.toFixed(1)}</Badge>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(business.rating! as number) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">({business.userRatingsTotal} reseñas)</span>
                </div>
              )}
              
              <div className="space-y-3 mt-4 text-sm">
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
                           {business.website}
                        </a>
                    </div>
                )}
                <div className="flex items-start">
                    <Mail className="w-4 h-4 mr-3 mt-1 text-muted-foreground flex-shrink-0" />
                    <span>{business.formattedAddress}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2">
            <div className="space-y-8">
                {business.photos && business.photos.length > 1 && (
                    <Card>
                        <CardHeader><CardTitle>Galería</CardTitle></CardHeader>
                        <CardContent>
                            <Carousel className="w-full">
                                <CarouselContent>
                                    {business.photos.map((photo, index) => (
                                        <CarouselItem key={index}>
                                            <Image
                                                src={photo.url}
                                                alt={`${business.displayName} - foto ${index + 1}`}
                                                width={1000}
                                                height={600}
                                                className="w-full h-auto max-h-96 object-contain rounded-lg bg-muted"
                                            />
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="left-4"/>
                                <CarouselNext className="right-4"/>
                            </Carousel>
                        </CardContent>
                    </Card>
                )}

                 {business.openingHours && business.openingHours.length > 0 && (
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5"/> Horario de Apertura
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                           <ul className="space-y-1 text-muted-foreground">
                             {business.openingHours.map((line, i) => (
                                 <li key={i}>{line}</li>
                             ))}
                           </ul>
                        </CardContent>
                    </Card>
                 )}
            </div>

            <div className="mt-8">
                <Button asChild>
                    <Link href="/directory">Volver al Directorio</Link>
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
