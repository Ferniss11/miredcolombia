
import HomePageClient from '@/components/home/HomePageClient';
import { getEurToCopRate } from '@/lib/currency-actions';
import { getPublishedBlogPosts } from "@/lib/blog-actions";
import { getSavedBusinessesAction } from '@/lib/directory-actions';
import { getPublicJobPostingsAction } from '@/lib/job-posting/infrastructure/nextjs/job-posting.server-actions';

export default async function HomePage() {
  // Fetch all data in parallel
  const [{ businesses }, { data: jobs }, { posts }, eurToCopRate] = await Promise.all([
    getSavedBusinessesAction(true),
    getPublicJobPostingsAction(),
    getPublishedBlogPosts(),
    getEurToCopRate()
  ]);

  return <HomePageClient 
            eurToCopRate={eurToCopRate} 
            initialBusinesses={businesses || []}
            initialJobs={jobs?.slice(0, 4) || []}
            initialPosts={posts?.slice(0, 5) || []}
         />;
}
