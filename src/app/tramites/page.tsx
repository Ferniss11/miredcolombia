
import { Button } from "@/components/ui/button";

export default function TramitesPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline">Gestión de Trámites</h1>
        <p className="text-lg text-muted-foreground mt-2 font-body max-w-2xl mx-auto">
          Hacemos tus trámites con seguridad. Hazlos tú con nuestras guías o delégalo a nuestros partners expertos.
        </p>
         <Button className="mt-6" size="lg" asChild>
            <a href="#"> {/* TODO: Add partner link */}
                Solicitar ahora
            </a>
        </Button>
      </div>
    </div>
  );
}
