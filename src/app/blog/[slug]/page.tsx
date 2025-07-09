import { latestBlogPosts } from "@/lib/placeholder-data";
import { notFound } from "next/navigation";
import { Calendar, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = latestBlogPosts.find((p) => p.slug === params.slug);

  if (!post) {
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
            <span>Publicado el {post.date}</span>
          </div>
          <div className="flex items-center">
            <User className="w-4 h-4 mr-1.5" />
            <span>Por {post.author}</span>
          </div>
        </div>
      </header>
      
      <Image
        src="https://placehold.co/1200x600.png"
        alt={post.title}
        width={1200}
        height={600}
        data-ai-hint="topic abstract"
        className="w-full h-auto rounded-lg shadow-lg object-cover mb-8"
      />

      <div className="prose dark:prose-invert max-w-none font-body text-lg leading-relaxed">
        <p className="text-xl italic text-muted-foreground">{post.excerpt}</p>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla.</p>
        <h2>Una Mirada Profunda</h2>
        <p>Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur sodales ligula in libero. Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas mattis. Sed convallis tristique sem. Proin ut ligula vel nunc egestas porttitor. Morbi lectus risus, iaculis vel, suscipit quis, luctus non, massa. Fusce ac turpis quis ligula lacinia aliquet.</p>
        <ul>
            <li>First point of discussion.</li>
            <li>Second point that builds on the first.</li>
            <li>A concluding thought on the matter.</li>
        </ul>
        <p>Mauris ipsum. Nulla metus metus, ullamcorper vel, tincidunt sed, euismod in, nibh. Quisque volutpat condimentum velit. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nam nec ante. Sed lacinia, urna non tincidunt mattis, tortor neque adipiscing diam, a cursus ipsum ante quis turpis. Nulla facilisi. Ut fringilla. Suspendisse potenti. Nunc feugiat mi a tellus consequat imperdiet. Vestibulum sapien. Proin quam. Etiam ultrices.</p>
      </div>

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
