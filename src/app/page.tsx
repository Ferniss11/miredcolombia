
import HomePageClient from '@/components/home/HomePageClient';
import { getEurToCopRate } from '@/lib/currency-actions';
import { getPublishedBlogPosts } from '@/services/blog.service';

export default async function HomePage() {
  // Fetch all server-side data in the main page component
  const { posts } = await getPublishedBlogPosts();
  const eurToCopRate = await getEurToCopRate();

  return <HomePageClient 
            initialPosts={posts || []} 
            eurToCopRate={eurToCopRate} 
         />;
}
