
import { getPublishedBlogPosts } from "@/lib/blog-actions";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default async function BlogPage() {
  const { posts } = await getPublishedBlogPosts();

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline">Nuestro Blog</h1>
        <p className="text-lg text-muted-foreground mt-2 font-body max-w-2xl mx-auto">
          Noticias, historias y guías para la comunidad colombiana en España.
        </p>
      </div>

      {!posts || posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <h2 className="text-2xl font-semibold">Próximamente...</h2>
          <p>Aún no hay artículos publicados. ¡Vuelve pronto!</p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {posts.map((post, index) => {
            const isFirst = index === 0;
            const isSecondOrThird = index === 1 || index === 2;

            return (
              <div
                key={post.id}
                className={cn(
                  "group col-span-12 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1",
                  isFirst && "md:col-span-8 md:row-span-2",
                  isSecondOrThird && "md:col-span-4",
                  !isFirst && !isSecondOrThird && "md:col-span-4"
                )}
              >
                <Link href={`/blog/${post.slug}`} className="block w-full h-full">
                  <article className="relative w-full h-full">
                    <Image
                      src={post.featuredImageUrl || "https://placehold.co/800x600.png"}
                      alt={post.title}
                      fill
                      data-ai-hint={post.featuredImageHint || "blog post topic"}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="relative flex flex-col justify-end h-full p-6 text-white">
                       <h2 className={cn(
                         "font-headline font-bold line-clamp-3 transition-colors duration-300 group-hover:text-primary",
                         isFirst ? "text-3xl md:text-4xl" : "text-2xl"
                       )}>
                        {post.title}
                      </h2>
                      <p className={cn(
                          "mt-2 text-white/90 line-clamp-2",
                           isFirst ? "md:text-base" : "text-sm"
                      )}>
                        {post.introduction}
                      </p>
                      <div className="flex items-center text-xs text-white/80 mt-4 pt-4 border-t border-white/20">
                         <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1.5" />
                            {new Date(post.date).toLocaleDateString('es-ES', { month: 'long', day: 'numeric' })}
                        </div>
                        <span className="mx-2">·</span>
                        <div className="flex items-center">
                            <User className="w-4 h-4 mr-1.5" />
                            {post.author}
                        </div>
                        <div className="flex items-center ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Leer Más <ArrowRight className="ml-1 h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
