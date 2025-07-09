import { Heart, Handshake, Users, PlayCircle } from "lucide-react";

export default function AboutSection() {
    return (
        <section id="quienes-somos" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline" style={{ color: '#003893' }}>Quiénes Somos</h2>
                </div>
                <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
                    <div className="flex flex-col justify-center space-y-8 text-center lg:text-left">
                        <div className="space-y-4">
                            <div className="inline-block rounded-lg bg-gray-200 px-4 py-2 text-md font-semibold text-gray-800">Jennifer Mendoza – Tu guía de confianza</div>
                            <p className="max-w-lg mx-auto lg:mx-0 text-gray-600 md:text-xl/relaxed dark:text-gray-300 font-body">
                                Soy colombiana y viví la experiencia de migrar a España. Conozco cada paso, cada dificultad y cada alegría del proceso.
                            </p>
                        </div>
                        <div className="flex justify-center lg:justify-start gap-8 pt-4">
                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="bg-[#FFCD00] p-4 rounded-full flex items-center justify-center w-20 h-20 shadow-md">
                                    <Heart className="w-8 h-8 text-[#C70039]" fill="#C70039" />
                                </div>
                                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Calidez</span>
                            </div>
                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="bg-[#003893] p-4 rounded-full flex items-center justify-center w-20 h-20 shadow-md">
                                    <Handshake className="w-8 h-8 text-[#FFCD00]" />
                                </div>
                                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Confianza</span>
                            </div>
                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="bg-[#C70039] p-4 rounded-full flex items-center justify-center w-20 h-20 shadow-md">
                                    <Users className="w-8 h-8 text-white" />
                                </div>
                                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Acompañamiento</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-10 w-full max-w-sm text-center cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105">
                            <div className="relative inline-block">
                                <button aria-label="Play Jennifer's Video">
                                    <PlayCircle className="w-20 h-20 sm:w-24 sm:h-24 text-[#C70039] mx-auto transition-transform hover:scale-110" />
                                </button>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold mt-4 font-headline">Video de Jennifer</h3>
                            <p className="text-muted-foreground text-sm sm:text-base mt-1">Conoce mi historia de migración</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
