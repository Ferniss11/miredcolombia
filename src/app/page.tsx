'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import StripeCheckoutForm from "@/components/checkout/StripeCheckoutForm";
import { MessageCircle } from "lucide-react";
import Link from "next/link";

import type { MigrationPackage, MigrationService, PurchaseableItem } from '@/lib/types';
import HeroSection from '@/components/home/HeroSection';
import AboutSection from '@/components/home/AboutSection';
import StepsSection from '@/components/home/StepsSection';
import PackagesSection from '@/components/home/PackagesSection';
import ServicesSection from '@/components/home/ServicesSection';
import TimezoneSection from '@/components/home/TimezoneSection';
import BlogSection from '@/components/home/BlogSection';
import BusinessSection from '@/components/home/BusinessSection';


export default function HomePage() {
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PurchaseableItem | null>(null);

  const handlePurchaseClick = (item: MigrationPackage | MigrationService, type: 'package' | 'service') => {
    setSelectedItem({ ...item, type });
    setCheckoutOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);
  };

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <HeroSection />
      <AboutSection />
      <StepsSection />
      <PackagesSection handlePurchaseClick={handlePurchaseClick} formatPrice={formatPrice} />
      <ServicesSection handlePurchaseClick={handlePurchaseClick} formatPrice={formatPrice} />
      <TimezoneSection />
      <BlogSection />
      <BusinessSection />

      <Link href="#" className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg z-20">
        <MessageCircle className="h-6 w-6" />
        <span className="sr-only">Chat WhatsApp</span>
      </Link>

      <Dialog open={isCheckoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Completa tu compra</DialogTitle>
            {selectedItem && 
                <DialogDescription>
                    Estás a un paso de adquirir {selectedItem?.name || selectedItem?.title}.
                </DialogDescription>
            }
          </DialogHeader>
          {selectedItem && (
            <StripeCheckoutForm item={selectedItem} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
