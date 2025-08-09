
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import type { UserRole } from "@/lib/types";

const formSchema = z.object({
  email: z.string().email({ message: "Dirección de correo electrónico inválida." }),
  password: z.string().min(1, { message: "La contraseña es obligatoria." }),
});

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.804 12.191C34.526 8.246 29.636 6 24 6C12.955 6 4 14.955 4 26s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039L38.804 12.191C34.526 8.246 29.636 6 24 6C16.318 6 9.656 10.083 6.306 14.691z"></path>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.394 44 31.023 44 26c0-1.341-.138-2.65-.389-3.917z"></path>
  </svg>
);


export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const [isFormPending, startFormTransition] = useTransition();
  const [isGooglePending, setIsGooglePending] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startFormTransition(async () => {
      const { error } = await loginWithEmail(values.email, values.password);
      if (error) {
        toast({
          variant: "destructive",
          title: "Error de Inicio de Sesión",
          description: "Credenciales inválidas. Por favor, inténtalo de nuevo.",
        });
      } else {
        toast({
          title: "¡Bienvenido de vuelta!",
          description: "Has iniciado sesión exitosamente.",
        });
        // The redirection is handled by the page's useEffect now.
      }
    });
  }

  async function handleGoogleSignIn() {
    setIsGooglePending(true);
    // For login, we don't need to specify a role, as the profile should already exist.
    const { error } = await loginWithGoogle('User'); // Default to 'User', it will be ignored if profile exists
    if (error) {
        toast({
            variant: "destructive",
            title: "Error de Inicio de Sesión",
            description: error || "No se pudo iniciar sesión con Google. Inténtalo de nuevo.",
        });
    } else {
        toast({
            title: "¡Bienvenido de vuelta!",
            description: "Has iniciado sesión exitosamente.",
        });
       // The redirection is handled by the page's useEffect now.
    }
    setIsGooglePending(false);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="nombre@ejemplo.com" {...field} disabled={isFormPending || isGooglePending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} disabled={isFormPending || isGooglePending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isFormPending || isGooglePending}>
              {isFormPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Sesión
            </Button>
          </form>
        </Form>
        <Separator className="my-6" />
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isFormPending || isGooglePending}>
            {isGooglePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Continuar con Google
        </Button>
      </CardContent>
    </Card>
  );
}
