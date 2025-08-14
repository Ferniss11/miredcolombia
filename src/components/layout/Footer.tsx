
'use client';

import { Instagram, Youtube } from "lucide-react";
import Link from "next/link";
import Image from 'next/image';
import ChatWidget from "../chat/ChatWidget";
import { useChat } from "@/context/ChatContext";

const TikTokIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className="h-6 w-6"
    >
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.74-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.73-1.52.4-.64.59-1.43.6-2.23.02-3.41.01-6.82.01-10.23Z"/>
    </svg>
);


export default function Footer() {
  const { chatContext, isChatOpen, setChatOpen } = useChat();
  
  return (
    <>
    <footer className="bg-white dark:bg-gray-900 border-t">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
             <Link href="/" className="flex items-center space-x-2">
                <Image src="https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FLOGO.png?alt=media&token=86f8e9f6-587a-4cb6-bae1-15b0c815f22b" alt="Mi Red Colombia Logo" width={32} height={32} />
                <span className="font-bold text-xl font-headline">Mi Red Colombia</span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-base">
              Conectando a la comunidad colombiana en España.
            </p>
            <div className="flex space-x-6">
              <Link href="https://www.instagram.com/mi_red_colombia" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-6 w-6" />
              </Link>
              <Link href="https://www.youtube.com/@MiRedColombia" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">YouTube</span>
                <Youtube className="h-6 w-6" />
              </Link>
              <Link href="https://www.tiktok.com/@miredcolombia" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">TikTok</span>
                <TikTokIcon />
              </Link>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase font-headline">Explorar</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link href="/directorio" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Negocios</Link></li>
                  <li><Link href="/empleos" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Empleo</Link></li>
                  <li><Link href="/servicios" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Servicios</Link></li>
                  <li><Link href="/blog" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Blog</Link></li>
                  <li><Link href="/precios" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Precios</Link></li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase font-headline">Legal</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link href="/legal/privacidad" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Privacidad</Link></li>
                  <li><Link href="/legal/terminos" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Términos</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
          <p className="text-base text-gray-400 dark:text-gray-500 xl:text-center">&copy; {new Date().getFullYear()} Mi Red Colombia. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
    {/* The global chat widget is now rendered here and controlled by context */}
    <ChatWidget />
    </>
  );
}
