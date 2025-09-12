

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Newspaper, Calendar, User } from "lucide-react";
import Image from "next/image";
import { BlogPost } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BlogPostCard } from "../blog/BlogPostCard";

export default function BlogSection({ posts }: { posts: BlogPost[] }) {
    if (!posts || posts.length === 0) {
        return null;
    }
    
    // We expect 5 posts for this layout
    const mainPosts = posts.slice(0, 2);
    const secondaryPosts = posts.slice(2, 5);

    return (
        <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6 max-w-6xl">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">De Nuestro Blog</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Noticias, Historias y Guías</h2>
                        <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-300 font-body">
                            Mantente al día con contenido relevante para la comunidad colombiana en España, desde historias de éxito hasta consejos de inmigración.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 py-12">
                    {/* First Row: 2 larger posts */}
                    {mainPosts.map(post => (
                        <div key={post.id} className="lg:col-span-3">
                            <BlogPostCard post={post} className="h-full" />
                        </div>
                    ))}
                    
                    {/* Second Row: 3 smaller posts */}
                    {secondaryPosts.map(post => (
                         <div key={post.id} className="md:col-span-1 lg:col-span-2">
                            <BlogPostCard post={post} className="h-full" />
                        </div>
                    ))}
                </div>
                
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
