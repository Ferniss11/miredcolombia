import HomePageClient from '@/components/home/HomePageClient';
import HeroSection from '@/components/home/HeroSection';
import AboutSection from '@/components/home/AboutSection';
import StepsSection from '@/components/home/StepsSection';
import PackagesSection from '@/components/home/PackagesSection';
import ServicesSection from '@/components/home/ServicesSection';
import TimezoneSection from '@/components/home/TimezoneSection';
import BlogSection from '@/components/home/BlogSection';
import BusinessSection from '@/components/home/BusinessSection';

export default function HomePage() {
  return (
    <HomePageClient>
      <HeroSection />
      <AboutSection />
      <StepsSection />
      <PackagesSection />
      <ServicesSection />
      <TimezoneSection />
      <BlogSection />
      <BusinessSection />
    </HomePageClient>
  );
}
