'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import StripeCheckoutForm from "@/components/checkout/StripeCheckoutForm";
import type { MigrationPackage, MigrationService, PurchaseableItem } from '@/lib/types';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

export default function HomePageClient({ children }: { children: React.ReactNode }) {
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PurchaseableItem | null>(null);

  const handlePurchaseClick = (item: MigrationPackage | MigrationService, type: 'package' | 'service') => {
    setSelectedItem({ ...item, type });
    setCheckoutOpen(true);
  };

  // Clone children to inject the handlePurchaseClick prop into specific components
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      // Check if the component type name matches, which is less fragile than direct comparison
      const childType = child.type as React.FunctionComponent & { displayName?: string };
      if (childType.displayName === 'PackagesSection' || childType.displayName === 'ServicesSection') {
        return React.cloneElement(child, { handlePurchaseClick } as any);
      }
    }
    return child;
  });

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <main className="flex-1">
        {childrenWithProps}
      </main>

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
