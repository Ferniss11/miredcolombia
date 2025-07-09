import { featuredBusinesses } from "@/lib/placeholder-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Building, Globe, Mail, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default function BusinessProfilePage({ params }: { params: { slug: string } }) {
  const business = featuredBusinesses.find((b) => b.slug === params.slug);

  if (!business) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card className="overflow-hidden sticky top-24">
            <CardHeader className="p-0">
              <Image
                src={business.imageUrl}
                alt={business.name}
                width={600}
                height={400}
                data-ai-hint={`${business.category} interior detail`}
                className="w-full h-64 object-cover"
              />
            </CardHeader>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold font-headline">{business.name}</h2>
              <p className="text-md text-muted-foreground flex items-center mt-2">
                <Building className="w-4 h-4 mr-2" />
                {business.category}
              </p>
              <div className="space-y-3 mt-4">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span>{business.phone}</span>
                </div>
                <div className="flex items-center">
                  <Globe className="w-4 h-4 mr-3 text-muted-foreground" />
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {business.website}
                  </a>
                </div>
                <div className="flex items-start">
                  <Mail className="w-4 h-4 mr-3 mt-1 text-muted-foreground" />
                  <span>{business.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
            <h1 className="text-4xl font-bold font-headline mb-6">Sobre {business.name}</h1>
            <div className="prose dark:prose-invert max-w-none font-body text-lg">
                <p>{business.longDescription}</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue.</p>
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
