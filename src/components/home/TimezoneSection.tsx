import RealTimeClocks from "@/components/layout/RealTimeClocks";

export default function TimezoneSection() {
    return (
        <section id="horarios" className="w-full py-12 md:py-24 lg:py-32 bg-background">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline text-black">
                        Estamos Para Ti, Sin Importar la Hora
                    </h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
                        Coordinemos una llamada en el horario que mejor te convenga. Aquí tienes las horas actuales para que planifiquemos juntos.
                    </p>
                </div>
                <RealTimeClocks />
            </div>
        </section>
    );
}
