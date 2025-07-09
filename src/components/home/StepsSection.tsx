import { cn } from "@/lib/utils";
import { FileStack, PlaneLanding, Gavel, Home as HomeIcon, Handshake } from "lucide-react";

const steps = [
    {
        Icon: FileStack,
        title: "Preparación en tu país",
        description: "Documentos, apostillas y requisitos previos",
    },
    {
        Icon: PlaneLanding,
        title: "Llegada a España",
        description: "Recibimiento y primeros pasos",
    },
    {
        Icon: Gavel,
        title: "Trámites legales",
        description: "NIE, TIE y documentación oficial",
    },
    {
        Icon: HomeIcon,
        title: "Vivienda y alojamiento",
        description: "Encontrar tu hogar en España",
    },
    {
        Icon: Handshake,
        title: "Integración y comunidad",
        description: "Conectar con la comunidad colombiana",
    },
];

const stepColors = [
    { bg: "bg-[#FFCD00]", text: "text-black" }, // Yellow
    { bg: "bg-[#003893]", text: "text-white" }, // Blue
    { bg: "bg-[#C70039]", text: "text-white" }, // Red
];

export default function StepsSection() {
    return (
        <section id="paso-a-paso" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Tu Viaje a España, Paso a Paso</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
                        Te guiamos en cada etapa del proceso para que tu transición sea lo más fluida y tranquila posible.
                    </p>
                </div>

                <div className="relative max-w-3xl mx-auto">
                    {/* The vertical line */}
                    <div className="absolute left-8 top-8 h-full w-0.5 bg-gray-200 dark:bg-gray-700 md:left-1/2 md:-translate-x-1/2"></div>

                    {steps.map((step, index) => {
                        const { Icon, title, description } = step;
                        const color = stepColors[index % stepColors.length];
                        const isLeft = index % 2 === 0;

                        return (
                            <div key={index} className={cn("relative flex items-start mb-12", !isLeft && "md:flex-row-reverse")}>
                                {/* Content for left/right side */}
                                <div className="md:w-1/2">
                                    <div className={cn("pl-24 md:pl-0", isLeft ? "md:pr-16 md:text-right" : "md:pl-16 md:text-left")}>
                                        <div className={cn(
                                            "flex items-center gap-3 mb-1",
                                            isLeft ? "md:justify-end md:flex-row-reverse" : "md:justify-start"
                                        )}>
                                            <h3 className="text-xl font-bold font-headline">{title}</h3>
                                            <Icon className="w-8 h-8 text-accent shrink-0" />
                                        </div>
                                        <p className="text-muted-foreground mt-1">{description}</p>
                                    </div>
                                </div>

                                {/* Spacer for the other side on desktop */}
                                <div className="hidden md:block w-1/2"></div>

                                {/* The circle on the timeline */}
                                <div className={cn(
                                    "absolute left-8 top-0 flex items-center justify-center w-16 h-16 rounded-full font-bold text-2xl shadow-lg border-4 border-background md:left-1/2 md:-translate-x-1/2 -translate-x-1/2",
                                    color.bg,
                                    color.text
                                )}>
                                    {index + 1}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    );
}
