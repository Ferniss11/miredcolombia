
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, User } from 'lucide-react';
import type { BlogPost } from '@/lib/types';
import { cn } from '@/lib/utils';

interface BlogPostCardProps {
    post: BlogPost;
    className?: string;
}

export const BlogPostCard = ({ post, className }: BlogPostCardProps) => {
    return (
        <Card className={cn("flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full", className)}>
            {post.featuredImageUrl && (
                <Link href={`/blog/${post.slug}`} className="block">
                    <Image
                        src={post.featuredImageUrl}
                        alt={post.title}
                        width={400}
                        height={225}
                        data-ai-hint={post.featuredImageHint || "blog post topic"}
                        className="w-full h-48 object-cover"
                    />
                </Link>
            )}
            <CardHeader>
                <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                    <CardTitle className="font-headline line-clamp-2 text-xl h-14">{post.title}</CardTitle>
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
                <Button asChild variant="link" className="text-foreground p-0 h-auto font-semibold">
                    <Link href={`/blog/${post.slug}`}>
                        Leer Más <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
