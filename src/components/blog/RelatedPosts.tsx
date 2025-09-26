
import React from 'react';
import { BlogPostCard } from './BlogPostCard';
import type { BlogPost } from '@/lib/types';
import { Newspaper } from 'lucide-react';

interface RelatedPostsProps {
  posts: BlogPost[];
}

const RelatedPosts: React.FC<RelatedPostsProps> = ({ posts }) => {
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-12 border-t">
      <h2 className="text-3xl font-bold font-headline mb-8 text-center flex items-center justify-center gap-3">
        <Newspaper className="w-8 h-8" />
        Artículos Relacionados
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map(post => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
};

export default RelatedPosts;
