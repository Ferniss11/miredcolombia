import HeroSection from '@/components/home/HeroSection';
import AboutSection from '@/components/home/AboutSection';
import StepsSection from '@/components/home/StepsSection';
import TimezoneSection from '@/components/home/TimezoneSection';
import BlogSection from '@/components/home/BlogSection';
import BusinessSection from '@/components/home/BusinessSection';
import HomePageClient from '@/components/home/HomePageClient';

// This is now a Server Component. It can fetch data.
export default function HomePage() {

  return (
    <HomePageClient>
      {/* These are server components, rendered on the server and passed as children */}
      <HeroSection />
      <AboutSection />
      <StepsSection />
      <TimezoneSection />
      <BlogSection />
      <BusinessSection />
    </HomePageClient>
  );
}
