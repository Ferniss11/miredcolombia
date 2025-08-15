

import HomePageClient from '@/components/home/HomePageClient';
import { getEurToCopRate } from '@/lib/currency-actions';
import { getSavedBusinessesAction } from '@/lib/directory-actions';
import { getPublicJobPostingsAction } from '@/lib/job-posting/infrastructure/nextjs/job-posting.server-actions';
import type { PlaceDetails, BlogPost, JobsCtaSectionProps } from '@/lib/types';

// Correctly import the Use Case and Repository from the hexagonal architecture
import { GetAllBlogPostsUseCase } from '@/lib/blog/application/get-all-blog-posts.use-case';
import { FirestoreBlogPostRepository } from '@/lib/blog/infrastructure/persistence/firestore-blog.repository';


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
  // Instantiate the repository and use case directly
  const blogRepository = new FirestoreBlogPostRepository();
  const getAllPostsUseCase = new GetAllBlogPostsUseCase(blogRepository);

  // Fetch all data in parallel
  const [{ businesses }, { data: jobs }, allPosts, eurToCopRate] = await Promise.all([
    getSavedBusinessesAction(true),
    getPublicJobPostingsAction(),
    getAllPostsUseCase.execute(true), // Fetch all published posts using the use case
    getEurToCopRate()
  ]);

  // Filter and slice the posts here in the server component
  const latestPosts = allPosts
    .filter(post => post.status === 'Published')
    .slice(0, 5);

  // Shuffle businesses on the server to prevent hydration errors
  const allBusinesses = businesses || [];
  const randomBusinesses = shuffleArray([...allBusinesses]).slice(0, 5);


  return (
    <HomePageClient
        eurToCopRate={eurToCopRate} 
        initialBusinesses={randomBusinesses}
        initialJobs={jobs?.slice(0, 4) || []}
        initialPosts={latestPosts}
     />
  );
}
