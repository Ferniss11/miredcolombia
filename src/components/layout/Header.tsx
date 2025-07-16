
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, User, LogIn, MessageCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { signOutUser } from "@/lib/firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from 'next/image';

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/directory", label: "Directorio" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Precios" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOutUser();
    toast({ title: "Has cerrado sesión." });
    router.push("/");
    router.refresh();
  };
  
  const renderNavLinks = (isMobile = false) => (
    navLinks.map(({ href, label }) => (
      <Link
        key={href}
        href={href}
        onClick={() => isMobile && setOpen(false)}
        className={cn(
          "transition-colors hover:text-primary",
          pathname === href ? "text-primary font-semibold" : "text-muted-foreground",
          isMobile ? "text-lg" : "text-sm font-medium"
        )}
      >
        {label}
      </Link>
    ))
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Left Nav */}
        <div className="flex items-center gap-6">
          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir Menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-full flex-col sm:max-w-xs">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Menú</SheetTitle>
                    <SheetDescription>Navegación principal del sitio web</SheetDescription>
                  </SheetHeader>
                <Link href="/" onClick={() => setOpen(false)} className="flex items-center space-x-2 mb-4">
                  <Image src="https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FLOGO.png?alt=media&token=86f8e9f6-587a-4cb6-bae1-15b0c815f22b" alt="Mi Red Colombia Logo" width={32} height={32} />
                  <span className="font-bold font-headline">Mi Red Colombia</span>
                </Link>
                <nav className="flex flex-col space-y-4">
                  {renderNavLinks(true)}
                </nav>
                <div className="mt-auto">
                  <Separator className="my-4" />
                  <div className="flex flex-col space-y-2">
                    <Button asChild variant="outline" onClick={() => setOpen(false)}>
                      <Link href="#">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Contacto WhatsApp
                      </Link>
                    </Button>
                    {!loading && (
                        <>
                          {user ? (
                             <Button variant="ghost" onClick={() => { handleSignOut(); setOpen(false); }}>
                              <LogOut className="mr-2 h-4 w-4" />
                              Cerrar Sesión
                            </Button>
                          ) : (
                            <>
                              <Button asChild onClick={() => setOpen(false)}>
                                <Link href="/login">Iniciar Sesión</Link>
                              </Button>
                              <Button asChild variant="secondary" onClick={() => setOpen(false)}>
                                <Link href="/signup">Regístrate</Link>
                              </Button>
                            </>
                          )}
                        </>
                      )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <Link href="/" className="hidden md:flex items-center space-x-2">
            <Image src="https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FLOGO.png?alt=media&token=86f8e9f6-587a-4cb6-bae1-15b0c815f22b" alt="Mi Red Colombia Logo" width={32} height={32} />
            <span className="hidden font-bold sm:inline-block font-headline">Mi Red Colombia</span>
          </Link>
          <nav className="hidden items-center space-x-6 md:flex">
            {renderNavLinks()}
          </nav>
        </div>
        
        {/* Right side: Auth buttons */}
        <div className="flex items-center justify-end space-x-2">
          {!loading && (
            <>
              {user ? (
                <>
                  <div className="hidden md:flex items-center space-x-2">
                    <Button asChild>
                      <Link href="/dashboard">Panel</Link>
                    </Button>
                    <Button variant="outline" onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </Button>
                  </div>
                   <Link href="/dashboard" className="md:hidden">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL ?? ""} alt={user.displayName ?? "User Avatar"}/>
                      <AvatarFallback>
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Panel</span>
                  </Link>
                </>
              ) : (
                <>
                  <div className="hidden md:flex items-center space-x-2">
                    <Button variant="ghost" asChild>
                      <Link href="/login">Iniciar Sesión</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/signup">Regístrate</Link>
                    </Button>
                  </div>
                  <Button asChild variant="ghost" size="icon" className="md:hidden">
                    <Link href="/login">
                      <LogIn className="h-5 w-5" />
                      <span className="sr-only">Iniciar Sesión</span>
                    </Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
