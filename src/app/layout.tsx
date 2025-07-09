import type { Metadata } from 'next';
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
