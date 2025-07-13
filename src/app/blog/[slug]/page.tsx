
import { getBlogPostBySlug, getPublishedBlogPosts } from "@/lib/blog-actions";
import { notFound } from "next/navigation";
import { Calendar, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// This tells Next.js to generate static pages for all published posts at build time
export async function generateStaticParams() {
  const result = await getPublishedBlogPosts();
  if (result.error || !result.posts) {
    return [];
  }
  return result.posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { post } = await getBlogPostBySlug(params.slug);

  if (!post || post.status !== 'Published') {
    notFound();
  }

  return (
    <article className="container mx-auto px-4 py-12 md:px-6 max-w-4xl">
      <header className="mb-8 text-center">
        <Link href="/blog" className="text-primary font-semibold hover:underline font-body">
          &larr; Volver al Blog
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold font-headline mt-4">{post.title}</h1>
        <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground mt-4 font-body">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1.5" />
            <span>Publicado el {new Date(post.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center">
            <User className="w-4 h-4 mr-1.5" />
            <span>Por {post.author}</span>
          </div>
        </div>
      </header>
      
      {post.featuredImageUrl && (
        <Image
            src={post.featuredImageUrl}
            alt={post.title}
            width={1200}
            height={600}
            data-ai-hint={post.featuredImageHint || 'blog post topic'}
            className="w-full h-auto rounded-lg shadow-lg object-cover mb-8"
            priority // Preload the main image
        />
      )}

      <div className="prose dark:prose-invert max-w-none font-body text-lg leading-relaxed">
        <p className="text-xl italic text-muted-foreground">{post.introduction}</p>
        
        {post.sections.map((section, index) => (
            <section key={index} className="mt-8">
                <h2 className="font-headline text-2xl md:text-3xl">{section.heading}</h2>
                {section.imageUrl && (
                     <Image
                        src={section.imageUrl}
                        alt={section.heading}
                        width={800}
                        height={400}
                        data-ai-hint={section.imageHint || 'section image'}
                        className="w-full h-auto rounded-lg shadow-md object-cover my-4"
                    />
                )}
                <div dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br />') }} />
            </section>
        ))}

        <h2 className="font-headline text-2xl md:text-3xl mt-8">Conclusión</h2>
        <p>{post.conclusion}</p>
      </div>

       {post.suggestedTags && post.suggestedTags.length > 0 && (
        <div className="mt-8 pt-4 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">Etiquetas</h3>
          <div className="flex flex-wrap gap-2">
            {post.suggestedTags.map((tag) => (
              <span key={tag} className="bg-secondary text-secondary-foreground text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 text-center">
        <Button asChild>
            <Link href="/blog">
                Explorar Más Artículos
            </Link>
        </Button>
      </div>
    </article>
  );
}
