import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/context/AuthContext';
import LayoutProvider from '@/components/layout/LayoutProvider';

export const metadata: Metadata = {
  title: 'Colombia en España',
  description: 'Conectando a la comunidad colombiana en España.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <Script id="website-ownership-verification" strategy="afterInteractive" data-noptimize="1" data-cfasync="false" data-wpfc-render="false">
          {`
            (function () {
                var script = document.createElement("script");
                script.async = 1;
                script.src = 'https://mn-tz.com/NDM1OTUy.js?t=435952';
                document.head.appendChild(script);
            })();
          `}
        </Script>
      </head>
      <body className={cn("min-h-screen bg-background font-body antialiased")}>
        <AuthProvider>
          <LayoutProvider>
            {children}
          </LayoutProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
