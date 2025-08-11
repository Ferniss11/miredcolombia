
import HomePageClient from '@/components/home/HomePageClient';
import { getEurToCopRate } from '@/lib/currency-actions';
import { getPublishedBlogPosts } from "@/lib/blog-actions";
import { getSavedBusinessesAction } from '@/lib/directory-actions';
import { getPublicJobPostingsAction } from '@/lib/job-posting/infrastructure/nextjs/job-posting.server-actions';
import type { PlaceDetails } from '@/lib/types';

// Helper function to shuffle an array (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length,  randomIndex;
  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}


export default async function HomePage() {
  // Fetch all data in parallel
  const [{ businesses }, { data: jobs }, { posts }, eurToCopRate] = await Promise.all([
    getSavedBusinessesAction(true),
    getPublicJobPostingsAction(),
    getPublishedBlogPosts(6), // Fetch 6 posts for the 2+3+1 layout
    getEurToCopRate()
  ]);

  // Shuffle businesses on the server to prevent hydration errors
  const allBusinesses = businesses || [];
  const randomBusinesses = shuffleArray([...allBusinesses]).slice(0, 5);


  return <HomePageClient 
            eurToCopRate={eurToCopRate} 
            initialBusinesses={randomBusinesses}
            initialJobs={jobs?.slice(0, 4) || []}
            initialPosts={posts || []}
         />;
}
