import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/context/AuthContext';
import LayoutProvider from '@/components/layout/LayoutProvider';
import { ThemeProvider } from '@/components/ui/theme-provider';


export const metadata: Metadata = {
  title: 'Mi Red Colombia',
  description: 'Tu guía para vivir, trabajar y conectar en España.',
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
        <script async src="https://tpemd.com/content?trs=435952&shmarker=650276&lang=es&layout=S10391&powered_by=true&campaign_id=121&promo_id=4038" charSet="utf-8"></script>
      </head>
      <body className={cn("min-h-screen bg-background font-body antialiased")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <LayoutProvider>
              {children}
            </LayoutProvider>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
