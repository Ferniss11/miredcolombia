

import { getPublicBusinessDetailsAction } from "@/lib/directory-actions";
import { notFound } from "next/navigation";
import BusinessProfileClientPage from "./BusinessProfileClientPage";
import type { Metadata } from 'next'
 
type Props = {
  params: { slug: string }
}
 
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { business } = await getPublicBusinessDetailsAction(params.slug);
 
  if (!business) {
    return {
      title: 'Negocio no encontrado'
    }
  }
 
  return {
    title: `${business.displayName} | Mi Red Colombia`,
    description: `Detalles, ubicación y contacto de ${business.displayName}. ${business.category}.`,
  }
}

export default async function BusinessProfilePage({ params }: { params: { slug: string } }) {
  const { business, error } = await getPublicBusinessDetailsAction(params.slug);
  
  if (error || !business) {
    notFound();
  }

  return <BusinessProfileClientPage initialBusiness={business} />;
}
