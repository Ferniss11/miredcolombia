'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import StripeCheckoutForm from "@/components/checkout/StripeCheckoutForm";
import type { MigrationPackage, MigrationService, PurchaseableItem } from '@/lib/types';
import ChatWidget from '@/components/chat/ChatWidget';
import VideoModal from '@/components/ui/video-modal';

// Import sections directly
import HeroSection from './HeroSection';
import AboutSection from './AboutSection';
import StepsSection from './StepsSection';
import PackagesSection from './PackagesSection';
import ServicesSection from './ServicesSection';
import TimezoneSection from './TimezoneSection';
import BlogSection from './BlogSection';
import BusinessSection from './BusinessSection';


export default function HomePageClient() {
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PurchaseableItem | null>(null);

  const [isVideoOpen, setVideoOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  const handlePurchaseClick = (item: MigrationPackage | MigrationService, type: 'package' | 'service') => {
    setSelectedItem({ ...item, type });
    setCheckoutOpen(true);
  };

  const handleVideoClick = (url: string, title: string) => {
    setVideoUrl(url);
    setVideoTitle(title);
    setVideoOpen(true);
  }

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <main className="flex-1">
        <HeroSection />
        <AboutSection handleVideoClick={handleVideoClick} />
        <StepsSection />
        <PackagesSection handlePurchaseClick={handlePurchaseClick} />
        <ServicesSection handlePurchaseClick={handlePurchaseClick} />
        <TimezoneSection />
        <BlogSection />
        <BusinessSection />
      </main>

      <ChatWidget />

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

      <VideoModal 
        isOpen={isVideoOpen} 
        setIsOpen={setVideoOpen} 
        videoUrl={videoUrl} 
        title={videoTitle} 
      />
    </div>
  );
}
