
'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Upload,
  Loader2,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { BlogPost } from '@/lib/types';
import {
  getBlogPostsAction,
  updateBlogPostStatusAction,
  deleteBlogPostAction,
} from '@/lib/blog-actions';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

type PostStatus = 'Published' | 'Draft' | 'In Review' | 'Archived';

export default function AdminBlogManagementPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'All'>('All');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      const result = await getBlogPostsAction();
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else if (result.posts) {
        setPosts(result.posts);
      }
      setIsLoading(false);
    };
    fetchPosts();
  }, [toast]);

  const handleDelete = (postId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta entrada? Esta acción no se puede deshacer.')) {
        return;
    }
    startTransition(async () => {
      const result = await deleteBlogPostAction(postId);
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else {
        toast({ title: 'Éxito', description: 'La entrada ha sido eliminada.' });
        setPosts(posts.filter((p) => p.id !== postId));
      }
    });
  };

  const handleUpdateStatus = (postId: string, status: PostStatus) => {
    startTransition(async () => {
      const result = await updateBlogPostStatusAction(postId, status);
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else {
        toast({
          title: 'Éxito',
          description: 'El estado de la entrada ha sido actualizado.',
        });
        setPosts(posts.map((p) => (p.id === postId ? { ...p, status } : p)));
      }
    });
  };

  const statusCounts = {
    total: posts.length,
    published: posts.filter((p) => p.status === 'Published').length,
    draft: posts.filter((p) => p.status === 'Draft').length,
    inReview: posts.filter((p) => p.status === 'In Review').length,
    archived: posts.filter((p) => p.status === 'Archived').length,
  };

  const filteredPosts = posts
    .filter((post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((post) =>
      statusFilter === 'All' ? true : post.status === statusFilter
    );

  const getStatusBadgeClass = (status: BlogPost['status']) => {
    switch (status) {
      case 'Published':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'In Review':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Archived':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-headline">Gestión de Blog</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild>
          <Link href="/dashboard/admin/content" className="flex items-center">
            <Plus className="mr-2" /> Nueva Entrada con IA
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 min-w-[700px]">
            <Card>
            <CardContent className="p-4">
                <div className="text-2xl font-bold">{statusCounts.total}</div>
                <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
            </Card>
            <Card>
            <CardContent className="p-4">
                <div className="text-2xl font-bold">{statusCounts.published}</div>
                <p className="text-xs text-muted-foreground">Publicados</p>
            </CardContent>
            </Card>
            <Card>
            <CardContent className="p-4">
                <div className="text-2xl font-bold">{statusCounts.draft}</div>
                <p className="text-xs text-muted-foreground">Borradores</p>
            </CardContent>
            </Card>
            <Card>
            <CardContent className="p-4">
                <div className="text-2xl font-bold">{statusCounts.inReview}</div>
                <p className="text-xs text-muted-foreground">En Revisión</p>
            </CardContent>
            </Card>
            <Card>
            <CardContent className="p-4">
                <div className="text-2xl font-bold">{statusCounts.archived}</div>
                <p className="text-xs text-muted-foreground">Archivados</p>
            </CardContent>
            </Card>
        </div>
      </div>


      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar entradas..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          onValueChange={(value) => setStatusFilter(value as PostStatus | 'All')}
          defaultValue="All"
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">Todos los estados</SelectItem>
            <SelectItem value="Published">Publicado</SelectItem>
            <SelectItem value="Draft">Borrador</SelectItem>
            <SelectItem value="In Review">En Revisión</SelectItem>
            <SelectItem value="Archived">Archivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Cargando entradas...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No se encontraron entradas.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="flex flex-col overflow-hidden">
              <CardHeader className="p-0 relative">
                <Image
                  src={post.featuredImageUrl || 'https://placehold.co/400x200.png'}
                  alt={post.title}
                  width={400}
                  height={200}
                  data-ai-hint={post.featuredImageHint || 'blog post topic'}
                  className="w-full h-40 object-cover"
                />
                <Badge
                  className={cn(
                    'absolute top-2 right-2',
                    getStatusBadgeClass(post.status)
                  )}
                >
                  {post.status === 'In Review' ? 'En Revisión' : post.status}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <h3 className="font-bold font-headline text-lg leading-snug line-clamp-2">
                  {post.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
                  <Badge variant="secondary">{post.category}</Badge>
                  <span>{new Date(post.date).toLocaleDateString()}</span>
                </div>
              </CardContent>
              <CardFooter className="p-2 border-t bg-gray-50/50 dark:bg-card/50 flex items-center justify-between">
                {post.status === 'Draft' && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 h-8 text-xs px-2"
                    onClick={() => handleUpdateStatus(post.id, 'Published')}
                    disabled={isPending}
                  >
                    <Upload className="mr-1.5 h-3 w-3" /> Publicar
                  </Button>
                )}
                 {post.status === 'Published' && (
                  <Button variant="ghost" size="sm" asChild className="text-blue-600 h-8 text-xs px-2">
                     <Link href={`/blog/${post.slug}`} target="_blank">
                        <ExternalLink className="mr-1.5 h-3 w-3"/> Ver
                     </Link>
                  </Button>
                 )}
                 {post.status === 'In Review' && (
                     <span className="text-xs text-muted-foreground">Pendiente</span>
                 )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/admin/blog/edit/${post.id}`}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                        </Link>
                    </DropdownMenuItem>
                    {post.status !== 'Published' && (
                        <DropdownMenuItem asChild>
                             <Link href={`/blog/previsualizar/${post.id}`} target="_blank">
                                <Eye className="mr-2 h-4 w-4" /> Previsualizar
                            </Link>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDelete(post.id)} className="text-red-600" disabled={isPending}>
                       <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
