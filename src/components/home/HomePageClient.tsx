'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import StripeCheckoutForm from "@/components/checkout/StripeCheckoutForm";
import type { MigrationPackage, MigrationService, PurchaseableItem, BlogPost, PlaceDetails, JobPosting } from '@/lib/types';
import VideoModal from '@/components/ui/video-modal';

// Import sections directly
import HeroSection from './HeroSection';
import AboutSection from './AboutSection';
import StepsSection from './StepsSection';
import PackagesSection from './PackagesSection';
import ServicesSection from './ServicesSection';
import AiAssistantSection from './AiAssistantSection';
import BlogSection from './BlogSection';
import BusinessSection from './BusinessSection';
import TestimonialsSection from './TestimonialsSection';
import DirectorySection from './DirectorySection';
import JobsSection from './JobsSection';
import { useChat } from '@/context/ChatContext';

type HomePageClientProps = {
  initialPosts: BlogPost[];
  eurToCopRate: number;
  initialBusinesses: PlaceDetails[];
  initialJobs: JobPosting[]; // Add jobs prop
}

export default function HomePageClient({ initialPosts, eurToCopRate, initialBusinesses, initialJobs }: HomePageClientProps) {
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PurchaseableItem | null>(null);

  const [isVideoOpen, setVideoOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  
  const { openChat } = useChat();

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
        <StepsSection />
        <AboutSection handleVideoClick={handleVideoClick} />
        <AiAssistantSection onOpenChatModal={openChat} />
        <PackagesSection eurToCopRate={eurToCopRate} />
        <ServicesSection eurToCopRate={eurToCopRate} />
        <JobsSection jobs={initialJobs} />
        <DirectorySection businesses={initialBusinesses} />
        <BusinessSection />
        <BlogSection posts={initialPosts} />
        <TestimonialsSection />
      </main>

      <Dialog open={isCheckoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Completa tu compra</DialogTitle>
            {selectedItem && (
                <DialogDescription>
                    Estás a un paso de adquirir {selectedItem.name}.
                </DialogDescription>
            )}
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
