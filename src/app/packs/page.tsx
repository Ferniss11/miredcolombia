

import PackagesSection from "@/components/home/PackagesSection";
import { Button } from "@/components/ui/button";

export default function PacksPage() {
  return (
    <div className="bg-background">
      <div className="py-12 md:py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-headline">Nuestros Packs</h1>
        <p className="text-lg text-muted-foreground mt-2 font-body max-w-2xl mx-auto">
          Elige una solución integral o solicita un presupuesto a medida.
        </p>
      </div>
      <PackagesSection />
       <div className="text-center pb-12">
            <h2 className="text-2xl font-bold font-headline">¿No sabes qué pack elegir?</h2>
            <p className="text-muted-foreground mt-2 mb-4">Habla con nuestro equipo y te ayudaremos a encontrar la mejor solución para ti.</p>
            <Button asChild>
                <a href="#"> {/* TODO: Add partner contact link */}
                    Contactar con un Asesor
                </a>
            </Button>
       </div>
    </div>
  );
}
