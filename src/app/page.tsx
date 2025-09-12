

import HomePageClient from '@/components/home/HomePageClient';
import { getEurToCopRate } from '@/lib/currency-actions';
import { getSavedBusinessesAction } from '@/lib/directory-actions';
import { getPublicJobPostingsAction } from '@/lib/job-posting/infrastructure/nextjs/job-posting.server-actions';
import type { PlaceDetails, BlogPost, JobsCtaSectionProps } from '@/lib/types';
import { GetAllGuidesUseCase } from '@/lib/guide/application/get-all-guides.use-case';
import { FirestoreGuideRepository } from '@/lib/guide/infrastructure/persistence/firestore-guide.repository';

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
  const guideRepository = new FirestoreGuideRepository();
  const getAllGuidesUseCase = new GetAllGuidesUseCase(guideRepository);


  // Fetch all data in parallel
  const [{ businesses }, { data: jobs }, allPosts, eurToCopRate, allGuides] = await Promise.all([
    getSavedBusinessesAction(true),
    getPublicJobPostingsAction(),
    getAllPostsUseCase.execute(true), // Fetch all published posts using the use case
    getEurToCopRate(),
    getAllGuidesUseCase.execute()
  ]);

  // Filter and slice the posts here in the server component
  const latestPosts = allPosts
    .filter(post => post.status === 'Published')
    .slice(0, 5); // We now want 5 posts for the home page

  const featuredGuides = allGuides.slice(0, 4);


  return (
    <HomePageClient
        eurToCopRate={eurToCopRate}
        initialPosts={latestPosts}
        initialGuides={featuredGuides}
     />
  );
}
