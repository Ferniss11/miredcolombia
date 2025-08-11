
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Newspaper, Calendar, User } from "lucide-react";
import Image from "next/image";
import { BlogPost } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function BlogSection({ posts }: { posts: BlogPost[] }) {
    const latestPosts = posts || [];

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
                    <div className="mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 py-12">
                        {latestPosts.map((post, index) => {
                            const isFirstTwo = index < 2;
                            return (
                                <div key={post.id} className={cn("col-span-12", isFirstTwo ? "lg:col-span-6" : "lg:col-span-4")}>
                                    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
                                        {post.featuredImageUrl && (
                                            <Link href={`/blog/${post.slug}`} className="block">
                                            <Image
                                                src={post.featuredImageUrl}
                                                alt={post.title}
                                                width={isFirstTwo ? 600 : 400}
                                                height={isFirstTwo ? 340 : 200}
                                                data-ai-hint={post.featuredImageHint || "blog post topic"}
                                                className={cn("w-full object-cover", isFirstTwo ? "h-64" : "h-48")}
                                            />
                                            </Link>
                                        )}
                                        <CardHeader>
                                            <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                                            <CardTitle className={cn("font-headline line-clamp-2", isFirstTwo ? "text-2xl h-16" : "text-xl h-14")}>{post.title}</CardTitle>
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
                                            <Button asChild variant="link" className="text-accent-foreground p-0 h-auto font-semibold">
                                                <Link href={`/blog/${post.slug}`}>
                                                    Leer Más <ArrowRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </div>
                            );
                        })}
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
