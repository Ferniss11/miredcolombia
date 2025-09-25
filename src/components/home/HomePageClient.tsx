
'use client';

import React from 'react';
// Import sections directly
import HeroSection from './HeroSection';
import AiAssistantSection from './AiAssistantSection';
import TestimonialsSection from './TestimonialsSection';
import { useChat } from '@/context/ChatContext';
import HowWeHelpSection from './HowWeHelpSection';
import PackagesSection from './PackagesSection';
import GuidesSection from './GuidesSection';
import { Guide } from '@/lib/guide/domain/guide.entity';


type HomePageClientProps = {
  initialGuides: Guide[];
}


export default function HomePageClient({ initialGuides }: HomePageClientProps) {
  const { openChat } = useChat();

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <main className="flex-1">
        <HeroSection />
        <AiAssistantSection onOpenChatModal={openChat} />
        <TestimonialsSection />
        <HowWeHelpSection />
        <PackagesSection />
        <GuidesSection guides={initialGuides} />
      </main>
    </div>
  );
}
