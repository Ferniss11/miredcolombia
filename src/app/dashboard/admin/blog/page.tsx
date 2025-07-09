
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Sparkles,
  Wand2,
  Plus,
  Search,
  Edit,
  Trash2,
  Upload,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockBlogPosts } from '@/lib/placeholder-data';
import { cn } from '@/lib/utils';
import type { BlogPost } from '@/lib/types';

export default function AdminBlogManagementPage() {
  const [posts, setPosts] = useState<BlogPost[]>(mockBlogPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const getStatusCounts = () => {
    return {
      total: mockBlogPosts.length,
      published: mockBlogPosts.filter((p) => p.status === 'Published').length,
      draft: mockBlogPosts.filter((p) => p.status === 'Draft').length,
      inReview: mockBlogPosts.filter((p) => p.status === 'In Review').length,
      archived: mockBlogPosts.filter((p) => p.status === 'Archived').length,
    };
  };

  const statusCounts = getStatusCounts();

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
        <Button variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:text-purple-800">
          <Sparkles className="mr-2" /> Asistente IA
        </Button>
        <Button variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800" asChild>
            <Link href="/dashboard/admin/content">
                <Wand2 className="mr-2" /> Generador IA
            </Link>
        </Button>
        <Button>
          <Plus className="mr-2" /> Nueva Entrada
        </Button>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
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
        <Select onValueChange={setStatusFilter} defaultValue="All">
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredPosts.map((post) => (
          <Card key={post.id} className="flex flex-col overflow-hidden">
            <CardHeader className="p-0 relative">
                <Image
                    src={post.imageUrl}
                    alt={post.title}
                    width={400}
                    height={200}
                    data-ai-hint="blog post topic"
                    className="w-full h-40 object-cover"
                />
                <Badge className={cn("absolute top-2 right-2", getStatusBadgeClass(post.status))}>
                    {post.status === 'In Review' ? 'En Revisión' : post.status}
                </Badge>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <h3 className="font-bold font-headline text-lg leading-snug line-clamp-2">
                {post.title}
              </h3>
              <p className="text-muted-foreground text-sm mt-2 line-clamp-3">
                {post.excerpt}
              </p>
               <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
                 <Badge variant="secondary">{post.category}</Badge>
                 <span>{post.date}</span>
               </div>
            </CardContent>
            <CardFooter className="p-2 border-t bg-gray-50/50 dark:bg-card/50">
                <div className="w-full flex items-center justify-end gap-1">
                    {post.status === 'Draft' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <Upload className="mr-2 h-4 w-4"/> Publicar
                        </Button>
                    )}
                    <Button variant="ghost" size="sm">
                        <Edit className="mr-2 h-4 w-4"/> Editar
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 h-8 w-8">
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      {filteredPosts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
              <p>No se encontraron entradas.</p>
          </div>
      )}
    </div>
  );
}
