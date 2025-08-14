
// src/components/services/ServiceCard.tsx
import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Tag, Phone, Copy, Mail } from 'lucide-react';
import type { ServiceListing } from '@/lib/types';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { FaWhatsapp } from 'react-icons/fa';

interface ServiceCardProps {
    listing: ServiceListing;
}

const formatPriceType = (priceType: 'per_hour' | 'fixed' | 'per_project') => {
    switch (priceType) {
        case 'per_hour': return '/ hora';
        case 'fixed': return 'fijo';
        case 'per_project': return '/ proyecto';
        default: return '';
    }
};

const ServiceCard: React.FC<ServiceCardProps> = ({ listing }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { toast } = useToast();
    const descriptionTooLong = listing.description.length > 100;

    const handleCopyEmail = () => {
        navigator.clipboard.writeText(listing.contactEmail);
        toast({ title: 'Copiado', description: '¡Correo electrónico copiado al portapapeles!' });
    };

    return (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded} asChild>
            <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full group">
                <CardHeader className="p-0 relative">
                    <Image
                        src={listing.imageUrl || "https://placehold.co/400x225.png"}
                        alt={listing.title}
                        width={400}
                        height={225}
                        data-ai-hint="professional service"
                        className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                    <Badge variant="outline" className="mb-2">{listing.category}</Badge>
                    <h3 className="font-bold font-headline text-lg leading-snug line-clamp-2 h-14 group-hover:text-primary transition-colors">
                        {listing.title}
                    </h3>
                    <div className="text-sm text-muted-foreground mt-2">
                        <p className={!isExpanded && descriptionTooLong ? "line-clamp-3" : ""}>
                            {listing.description}
                        </p>
                        {descriptionTooLong && (
                             <CollapsibleTrigger asChild>
                                <Button variant="link" className="p-0 h-auto text-xs">
                                     {isExpanded ? 'Ver menos' : 'Ver más'}
                                </Button>
                             </CollapsibleTrigger>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 mt-auto flex flex-col items-start gap-2">
                     <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{listing.city}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Tag className="h-4 w-4 flex-shrink-0" />
                        <span className="font-semibold text-foreground">€{listing.price}</span>
                        <span>{formatPriceType(listing.priceType)}</span>
                    </div>
                    
                    <div className='w-full space-y-2 pt-2'>
                        {listing.contactViaWhatsApp ? (
                            <Button asChild className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white">
                                <a href={`https://wa.me/${listing.contactPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                                    <FaWhatsapp className="mr-2 h-5 w-5" />
                                    Contactar por WhatsApp
                                </a>
                            </Button>
                        ) : (
                             <Button asChild className="w-full">
                                <a href={`tel:${listing.contactPhone.replace(/\D/g, '')}`}>
                                    <Phone className="mr-2 h-4 w-4" />
                                    Contactar por Teléfono
                                </a>
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" className="w-full h-auto text-xs text-muted-foreground" onClick={handleCopyEmail}>
                            <Mail className="mr-2 h-3 w-3" /> {listing.contactEmail} <Copy className="ml-2 h-3 w-3" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </Collapsible>
    );
};

export default ServiceCard;
