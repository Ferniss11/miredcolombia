
'use client';

import React from 'react';
import type { PlaceDetails, BlogPost, JobsCtaSectionProps } from '@/lib/types';

// Import sections directly
import HeroSection from './HeroSection';
import AboutSection from './AboutSection';
import StepsSection from './StepsSection';
import AiAssistantSection from './AiAssistantSection';
import BlogSection from './BlogSection';
import BusinessSection from './BusinessSection';
import TestimonialsSection from './TestimonialsSection';
import DirectorySection from './DirectorySection';
import JobsCtaSection from './JobsCtaSection';
import { useChat } from '@/context/ChatContext';
import HowWeHelpSection from './HowWeHelpSection';


type HomePageClientProps = {
  eurToCopRate: number;
  initialBusinesses: PlaceDetails[];
  initialJobs: JobsCtaSectionProps['jobs'];
  initialPosts: BlogPost[];
}


export default function HomePageClient({ eurToCopRate, initialBusinesses, initialJobs, initialPosts }: HomePageClientProps) {
  const { openChat } = useChat();

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <main className="flex-1">
        <HeroSection />
        <HowWeHelpSection />
        <StepsSection onOpenChatAssistant={openChat} />
        <AboutSection />
        <AiAssistantSection onOpenChatModal={openChat} />
        <JobsCtaSection jobs={initialJobs} />
        <DirectorySection businesses={initialBusinesses.slice(0, 4)} />
        <BusinessSection businesses={initialBusinesses} />
        <BlogSection posts={initialPosts} />
        <TestimonialsSection />
      </main>
    </div>
  );
}
