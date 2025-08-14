

import { getSavedBusinessesAction } from "@/lib/directory-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import DirectoryList from "@/components/directory/DirectoryList";

export default async function DirectoryPage() {
  const { businesses, error } = await getSavedBusinessesAction(true);

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline">Directorio de Negocios</h1>
        <p className="text-lg text-muted-foreground mt-2 font-body max-w-2xl mx-auto">
          Encuentra y conecta con negocios de colombianos en España.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al Cargar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* The new client component handles the search input and filtering */}
      <DirectoryList initialBusinesses={businesses || []} />
      
    </div>
  );
}
