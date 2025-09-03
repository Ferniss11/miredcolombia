
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
                        width={400}
                        height={200}
                        className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                    <h3 className="font-bold font-headline text-lg leading-snug line-clamp-2 h-14">{guide.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{guide.category}</p>
                </CardContent>
                <CardFooter className="p-2 border-t mt-auto">
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
