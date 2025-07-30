
import HomePageClient from '@/components/home/HomePageClient';
import { getEurToCopRate } from '@/lib/currency-actions';
import { getPublishedBlogPosts } from '@/services/blog.service';
import { getSavedBusinessesAction } from '@/lib/directory-actions';
import { getPublicJobPostingsAction } from '@/lib/job-posting/infrastructure/nextjs/job-posting.server-actions';

export default async function HomePage() {
  // Fetch all server-side data in the main page component
  const [{ posts }, { businesses }, { data: jobs }, eurToCopRate] = await Promise.all([
    getPublishedBlogPosts(),
    getSavedBusinessesAction(true),
    getPublicJobPostingsAction(),
    getEurToCopRate()
  ]);

  return <HomePageClient 
            initialPosts={posts || []} 
            eurToCopRate={eurToCopRate} 
            initialBusinesses={businesses?.slice(0, 4) || []}
            initialJobs={jobs?.slice(0, 4) || []}
         />;
}
