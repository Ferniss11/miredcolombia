
'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Loader2, Briefcase } from 'lucide-react';
import GuestJobApplicationSheet from '@/components/jobs/GuestJobApplicationSheet';

interface ApplyButtonProps {
  jobId: string;
  jobTitle: string;
}

export default function ApplyButton({ jobId, jobTitle }: ApplyButtonProps) {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleApply = async () => {
    if (!user) {
      // Open the sheet for guest users
      setIsSheetOpen(true);
      return;
    }

    if (!userProfile?.candidateProfile?.resumeUrl) {
      toast({
        variant: 'destructive',
        title: 'Perfil Incompleto',
        description: 'Por favor, sube tu currículum en tu perfil de candidato antes de aplicar.',
      });
      router.push('/dashboard/candidate-profile');
      return;
    }

    startTransition(async () => {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(`/api/jobs/${jobId}/apply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message || 'No se pudo enviar tu postulación.');
        }

        toast({
          title: '¡Postulación Enviada!',
          description: `Tu solicitud para el puesto de "${jobTitle}" ha sido enviada con éxito.`,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió.';
        toast({
          variant: 'destructive',
          title: 'Error al Postular',
          description: errorMessage,
        });
      }
    });
  };

  return (
    <>
      <Button onClick={handleApply} disabled={isPending}>
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Briefcase className="mr-2 h-4 w-4" />
        )}
        Aplicar a esta oferta
      </Button>
      
      <GuestJobApplicationSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        jobId={jobId}
        jobTitle={jobTitle}
      />
    </>
  );
}
