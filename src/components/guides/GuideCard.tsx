
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import DownloadGuideModal from './DownloadGuideModal';
import type { Guide } from '@/lib/guide/domain/guide.entity';

interface GuideCardProps {
    guide: Guide;
}

export default function GuideCard({ guide }: GuideCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                <CardHeader className="p-0 relative">
                     <Image
                        src={guide.coverImageUrl}
                        alt={guide.title}
                        width={500}
                        height={280}
                        className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </CardHeader>
                <CardContent className="p-6 flex-grow">
                    <p className="text-sm font-semibold text-primary mb-2">{guide.category}</p>
                    <h3 className="font-bold font-headline text-xl leading-snug line-clamp-2 h-14">{guide.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3 h-[60px]">{guide.description}</p>
                </CardContent>
                <CardFooter className="p-4 border-t mt-auto bg-muted/30">
                    <Button onClick={() => setIsModalOpen(true)} className="w-full">
                        <Download className="mr-2 h-4 w-4"/> Descargar Guía
                    </Button>
                </CardFooter>
            </Card>
            
            <DownloadGuideModal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                guide={guide}
            />
        </>
    );
}