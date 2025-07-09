import { featuredBusinesses } from "@/lib/placeholder-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, Building, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function DirectoryPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline">Directorio de Negocios</h1>
        <p className="text-lg text-muted-foreground mt-2 font-body">
          Encuentra y conecta con negocios de colombianos en España.
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, categoría o ciudad..."
            className="w-full pl-10 py-3 text-base"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {featuredBusinesses.concat(featuredBusinesses).map((business, index) => (
          <Card key={`${business.id}-${index}`} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <CardHeader className="p-0">
              <Image
                src={business.imageUrl}
                alt={business.name}
                width={400}
                height={250}
                data-ai-hint={`${business.category} interior`}
                className="w-full h-48 object-cover"
              />
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <h3 className="text-lg font-bold font-headline">{business.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center mt-1">
                <Building className="w-4 h-4 mr-2" />
                {business.category}
              </p>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{business.description}</p>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button asChild variant="link" className="text-accent-foreground p-0 h-auto">
                <Link href={`/directory/${business.slug}`}>
                  Ver Perfil <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
