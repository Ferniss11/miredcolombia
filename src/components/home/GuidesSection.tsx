
'use client';

import { BookOpen } from "lucide-react";
import GuideCard from "../guides/GuideCard";
import type { Guide } from "@/lib/guide/domain/guide.entity";

export default function GuidesSection({ guides }: { guides: Guide[] }) {

    if (!guides || guides.length === 0) {
        return null;
    }

    return (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
            <div className="container px-4 md:px-6 max-w-6xl">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                     <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-semibold">Recursos Gratuitos</div>
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Guías Descargables para Empezar con Buen Pie</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
                        Hemos preparado guías detalladas en PDF para los trámites más importantes. Descárgalas gratis y prepárate para tu nueva vida en España.
                    </p>
                </div>
                <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {guides.map((guide) => (
                        <GuideCard key={guide.id} guide={guide} />
                    ))}
                </div>
            </div>
        </section>
    );
}
