
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const valeriaPlans = [
    {
      name: 'Gratis',
      price: '0€',
      priceDetails: '/ mes',
      features: [
        '3 consultas al día',
        'Respuestas básicas de la base de conocimiento',
        'Acceso al chat 24/7',
      ],
      cta: 'Empieza Gratis',
      variant: 'outline'
    },
    {
      name: 'Plan Colombia',
      price: '2,99€',
      priceDetails: '/ mes',
      features: [
        'Consultas ilimitadas',
        'Respuestas extendidas y detalladas',
        'Acceso a checklists descargables',
        'Generación de documentos básicos en PDF',
      ],
      cta: 'Elegir Plan Colombia',
       variant: 'default'
    },
    {
      name: 'Plan España',
      price: '7,99€',
      priceDetails: '/ mes',
      features: [
        'Todo lo del Plan Colombia',
        'Alertas de empleo personalizadas',
        'Alertas de vivienda según tus criterios',
        'Acceso a todas las guías premium',
      ],
      cta: 'Elegir Plan España',
      variant: 'default'
    },
];

export default function ValeriaPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline">Valeria, tu Asistente IA</h1>
        <p className="text-lg text-muted-foreground mt-2 font-body max-w-2xl mx-auto">
          Valeria es la primera IA especializada en migración de Colombia a España. Disponible 24/7, habla tu idioma y responde al instante.
        </p>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {valeriaPlans.map((plan) => (
          <Card 
            key={plan.name} 
            className={cn(
                "flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300", 
                plan.name === "Plan Colombia" && "border-primary border-2 shadow-primary/20"
            )}
          >
            {plan.name === "Plan Colombia" && (
              <div className="bg-primary text-primary-foreground text-center py-1.5 text-sm font-semibold">
                Recomendado
              </div>
            )}
            <CardHeader className="items-center text-center">
              <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground ml-1">{plan.priceDetails}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant={plan.variant as any}>
                <a href="#"> {/* TODO: Link to Stripe Checkout */}
                  {plan.cta}
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="text-center mt-12">
        <Button size="lg" variant="ghost">Hablar con un asesor</Button>
      </div>
    </div>
  );
}
