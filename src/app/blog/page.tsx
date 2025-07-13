
import { getPublishedBlogPosts } from "@/lib/blog-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calendar, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function BlogPage() {
  const { posts } = await getPublishedBlogPosts();

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline">Nuestro Blog</h1>
        <p className="text-lg text-muted-foreground mt-2 font-body">
          Noticias, historias y guías para la comunidad colombiana en España.
        </p>
      </div>

      {!posts || posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <h2 className="text-2xl font-semibold">Próximamente...</h2>
          <p>Aún no hay artículos publicados. ¡Vuelve pronto!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Card key={post.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              {post.featuredImageUrl && (
                <Link href={`/blog/${post.slug}`} className="block">
                  <Image
                    src={post.featuredImageUrl}
                    alt={post.title}
                    width={400}
                    height={200}
                    data-ai-hint={post.featuredImageHint || "blog post topic"}
                    className="w-full h-48 object-cover"
                  />
                </Link>
              )}
              <CardHeader>
                <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                  <CardTitle className="font-headline text-2xl line-clamp-2">{post.title}</CardTitle>
                </Link>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground pt-2">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    {new Date(post.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1.5" />
                    {post.author}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground line-clamp-3">{post.introduction}</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="link" className="text-accent-foreground p-0 h-auto">
                  <Link href={`/blog/${post.slug}`}>
                    Leer Más <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
