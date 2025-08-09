

'use client';

import { Heart, Handshake, Users, PlayCircle, Scale } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import React from 'react';

type AboutSectionProps = {};

export default function AboutSection({}: AboutSectionProps) {
    const videoUrl = "https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FColombiasubir.mp4?alt=media&token=0158b045-9c77-4e91-958e-d17ba5b04068";
    const videoTitle = "Conoce mi historia de migración";
    const [showVideo, setShowVideo] = React.useState(false);

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
                    <div className="flex items-center justify-center w-full">
                        <div className="w-full max-w-lg aspect-video rounded-xl shadow-lg overflow-hidden transition-all duration-300">
                           {showVideo ? (
                                <video
                                    className="w-full h-full object-cover"
                                    controls
                                    autoPlay
                                    src={videoUrl}
                                >
                                    Tu navegador no soporta la etiqueta de video.
                                </video>
                           ) : (
                             <button 
                                onClick={() => setShowVideo(true)}
                                className="w-full h-full relative group"
                                aria-label="Play Jennifer's Video"
                            >
                                <Image 
                                    src="https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FImagen%20de%20WhatsApp%202025-07-16%20a%20las%2019.21.54_4f867863.jpg?alt=media&token=13812b89-71ac-42e1-8854-0a80f50339d2"
                                    alt="Jennifer Mendoza - Mi Red Colombia"
                                    layout="fill"
                                    objectFit="cover"
                                    className="transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors"></div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                                    <PlayCircle className="w-24 h-24 text-white/80 drop-shadow-lg transition-transform group-hover:scale-110 group-hover:text-white" />
                                    <h3 className="text-xl sm:text-2xl font-bold mt-4 font-headline" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.7)'}}>
                                        {videoTitle}
                                    </h3>
                                </div>
                            </button>
                           )}
                        </div>
                    </div>
                </div>

                {/* Separator */}
                <div className="my-16 border-t-2 border-dashed border-gray-300 dark:border-gray-700 max-w-4xl mx-auto"></div>

                {/* New Section for the Lawyer */}
                <div className="mx-auto max-w-6xl">
                    <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden transition-shadow hover:shadow-lg">
                        <div className="flex flex-col md:flex-row items-center p-6 space-y-4 md:space-y-0 md:space-x-6">
                            <div className="flex-shrink-0">
                                <Image 
                                    src="https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2Fabogada.jpg?alt=media&token=892b18ef-649e-4ae2-b39d-b70bd1630552"
                                    alt="Karla Santofimio Salas - Abogada Experta en Extranjería"
                                    width={100} // Medium size circle
                                    height={100}
                                    objectFit="cover"
                                    className="rounded-full border-4 border-primary/20"
                                />
                            </div>
                            <div className="flex-grow text-center md:text-left">
                                <p className="text-sm font-semibold text-primary">Colaboración Experta</p>
                                <h3 className="inline-block rounded-lg bg-gray-200 px-4 py-2 text-md font-semibold text-gray-800">Karla Santofimio Salas</h3>
                                <p className="max-w-lg mx-auto lg:mx-0 text-gray-600 md:text-xl/relaxed dark:text-gray-300 font-body">
                                    Contamos con el respaldo y la experiencia de Karla, abogada especializada en extranjería, para ofrecerte la asesoría legal más completa y actualizada.
                                </p>
                            </div>
                            <div className="flex-shrink-0">
                                <div className="flex items-center text-center space-x-3 bg-primary/10 text-primary p-3 rounded-lg">
                                    <Scale className="w-7 h-7" />
                                    <span className="font-semibold text-sm">Asesoría Legal</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

AboutSection.displayName = 'AboutSection';
