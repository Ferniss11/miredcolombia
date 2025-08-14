
import { subscriptionPlans } from "@/lib/placeholder-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline">Haz Crecer Tu Negocio Con Nosotros</h1>
        <p className="text-lg text-muted-foreground mt-2 font-body max-w-2xl mx-auto">
          Elige un plan que se ajuste a tus necesidades y sé descubierto por la comunidad colombiana en España.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {subscriptionPlans.map((plan) => (
          <Card 
            key={plan.id} 
            className={cn(
                "flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300", 
                plan.name === "Premium" && "border-primary border-2 shadow-primary/20"
            )}
          >
            {plan.name === "Premium" && (
              <div className="bg-primary text-primary-foreground text-center py-1.5 text-sm font-semibold">
                Más Popular
              </div>
            )}
            <CardHeader className="items-center text-center">
              <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
              <div className="text-4xl font-bold">{plan.price}</div>
              <CardDescription>Facturado mensualmente</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant={plan.name === "Premium" ? "default" : "outline"}>
                <Link href="/signup?role=advertiser">
                  {plan.cta}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
