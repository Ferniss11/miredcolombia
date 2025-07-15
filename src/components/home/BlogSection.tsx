
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Newspaper, Calendar, User } from "lucide-react";
import Image from "next/image";
import type { BlogPost } from "@/lib/types";

type BlogSectionProps = {
    posts: BlogPost[];
};

export default function BlogSection({ posts }: BlogSectionProps) {
    const latestPosts = posts.slice(0, 3);

    return (
        <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">De Nuestro Blog</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Noticias, Historias y Guías</h2>
                        <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-300 font-body">
                            Mantente al día con contenido relevante para la comunidad colombiana en España, desde historias de éxito hasta consejos de inmigración.
                        </p>
                    </div>
                </div>

                {latestPosts.length > 0 ? (
                    <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 py-12">
                        {latestPosts.map((post) => (
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
                                    <CardTitle className="font-headline text-xl line-clamp-2 h-14">{post.title}</CardTitle>
                                    </Link>
                                    <div className="flex items-center space-x-4 text-xs text-muted-foreground pt-2">
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-1.5" />
                                        {new Date(post.date).toLocaleDateString('es-ES')}
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
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No hay artículos recientes. ¡Vuelve pronto!</p>
                    </div>
                )}
                
                <div className="flex justify-center">
                    <Button asChild>
                        <Link href="/blog">
                            Visita El Blog <Newspaper className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
