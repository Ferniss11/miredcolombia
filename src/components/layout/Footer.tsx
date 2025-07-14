import { Facebook, Twitter, Instagram } from "lucide-react";
import Link from "next/link";
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
             <Link href="/" className="flex items-center space-x-2">
                <Image src="https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FLOGO.png?alt=media&token=86f8e9f6-587a-4cb6-bae1-15b0c815f22b" alt="Colombia en España Logo" width={32} height={32} />
                <span className="font-bold text-xl font-headline">Colombia en España</span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-base">
              Conectando a la comunidad colombiana en España.
            </p>
            <div className="flex space-x-6">
              <Link href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-6 w-6" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-6 w-6" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-6 w-6" />
              </Link>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase font-headline">Explorar</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link href="/directory" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Directorio</Link></li>
                  <li><Link href="/blog" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Blog</Link></li>
                  <li><Link href="/pricing" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Precios</Link></li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase font-headline">Legal</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link href="/legal/privacy" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Privacidad</Link></li>
                  <li><Link href="/legal/terms" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Términos</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
          <p className="text-base text-gray-400 dark:text-gray-500 xl:text-center">&copy; {new Date().getFullYear()} Colombia en España. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
