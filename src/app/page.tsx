import HomePageClient from '@/components/home/HomePageClient';
import { getPublishedBlogPosts } from '@/services/blog.service';

export default async function HomePage() {
  const { posts } = await getPublishedBlogPosts();
  return <HomePageClient initialPosts={posts || []} />;
}
