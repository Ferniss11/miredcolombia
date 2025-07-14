import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/context/AuthContext';
import LayoutProvider from '@/components/layout/LayoutProvider';

export const metadata: Metadata = {
  title: 'Colombia en España',
  description: 'Conectando a la comunidad colombiana en España.',
  icons: {
    icon: 'https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FLOGO.png?alt=media&token=86f8e9f6-587a-4cb6-bae1-15b0c815f22b',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
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
