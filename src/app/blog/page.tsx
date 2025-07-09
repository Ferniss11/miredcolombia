import { latestBlogPosts } from "@/lib/placeholder-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calendar, User } from "lucide-react";
import Link from "next/link";

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline">Nuestro Blog</h1>
        <p className="text-lg text-muted-foreground mt-2 font-body">
          Noticias, historias y guías para la comunidad colombiana en España.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {latestBlogPosts.concat(latestBlogPosts).map((post, index) => (
          <Card key={`${post.id}-${index}`} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                <CardTitle className="font-headline text-2xl">{post.title}</CardTitle>
              </Link>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground pt-2">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  {post.date}
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1.5" />
                  {post.author}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">{post.excerpt}</p>
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
    </div>
  );
}
