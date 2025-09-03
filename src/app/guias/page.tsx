
// src/app/guias/page.tsx
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import GuideCard from '@/components/guides/GuideCard';
import { BlogPostCard } from '@/components/blog/BlogPostCard';

// Use Cases and Repositories
import { GetAllGuidesUseCase } from '@/lib/guide/application/get-all-guides.use-case';
import { FirestoreGuideRepository } from '@/lib/guide/infrastructure/persistence/firestore-guide.repository';
import { GetAllBlogPostsUseCase } from '@/lib/blog/application/get-all-blog-posts.use-case';
import { FirestoreBlogPostRepository } from '@/lib/blog/infrastructure/persistence/firestore-blog.repository';

export const metadata: Metadata = {
  title: 'Guías y Artículos | Mi Red Colombia',
  description: 'Guías prácticas, recursos descargables y artículos informativos para la comunidad colombiana en España.',
};

export default async function GuiasPage() {
    const guideRepository = new FirestoreGuideRepository();
    const getAllGuidesUseCase = new GetAllGuidesUseCase(guideRepository);
    const guides = await getAllGuidesUseCase.execute();

    const blogRepository = new FirestoreBlogPostRepository();
    const getAllPostsUseCase = new GetAllBlogPostsUseCase(blogRepository);
    const posts = await getAllPostsUseCase.execute(true); // Fetch only published posts

    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold font-headline">Guías y Artículos</h1>
                <p className="text-lg text-muted-foreground mt-2 font-body max-w-2xl mx-auto">
                    Recursos prácticos, guías descargables y artículos de fondo para ayudarte en tu vida en España.
                </p>
            </div>

            {/* Downloadable Guides Section */}
            {guides.length > 0 && (
                <div className="mb-16">
                    <div className="flex items-center gap-3 mb-6">
                         <div className="p-2 bg-primary/10 rounded-md">
                            <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold font-headline">Guías Descargables</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {guides.map((guide) => (
                            <GuideCard key={guide.id} guide={guide} />
                        ))}
                    </div>
                </div>
            )}
            
            {/* Blog Posts Section */}
            <div>
                 <div className="flex items-center gap-3 mb-6">
                     <div className="p-2 bg-primary/10 rounded-md">
                        <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold font-headline">Artículos Recientes</h2>
                </div>

                {!posts || posts.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <p>No hay artículos publicados. ¡Vuelve pronto!</p>
                    </div>
                ) : (
                     <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {posts.map((post) => (
                           <div key={post.id} className="col-span-12 md:col-span-6 lg:col-span-4">
                                <BlogPostCard post={post} />
                           </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
