

import HomePageClient from '@/components/home/HomePageClient';
import { getEurToCopRate } from '@/lib/currency-actions';
import { getSavedBusinessesAction } from '@/lib/directory-actions';
import { getPublicJobPostingsAction } from '@/lib/job-posting/infrastructure/nextjs/job-posting.server-actions';
import type { PlaceDetails, BlogPost, JobsCtaSectionProps } from '@/lib/types';
import { GetAllGuidesUseCase } from '@/lib/guide/application/get-all-guides.use-case';
import { FirestoreGuideRepository } from '@/lib/guide/infrastructure/persistence/firestore-guide.repository';

import { GetAllBlogPostsUseCase } from '@/lib/blog/application/get-all-blog-posts.use-case';
import { FirestoreBlogPostRepository } from '@/lib/blog/infrastructure/persistence/firestore-blog.repository';


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
  const guideRepository = new FirestoreGuideRepository();
  const getAllGuidesUseCase = new GetAllGuidesUseCase(guideRepository);

  const allGuides = await getAllGuidesUseCase.execute();
  const featuredGuides = allGuides.slice(0, 3);


  return (
    <HomePageClient
        initialGuides={featuredGuides}
     />
  );
}
