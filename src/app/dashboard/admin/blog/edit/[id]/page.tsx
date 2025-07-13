
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { getBlogPostByIdAction, updateBlogPostAction } from '@/lib/blog-actions';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import type { BlogPost } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function AdminEditBlogPage() {
    const { id } = useParams();
    const postId = Array.isArray(id) ? id[0] : id;

    const { toast } = useToast();
    const router = useRouter();
    const [isSaving, startTransition] = useTransition();
    
    const [post, setPost] = useState<Partial<BlogPost> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!postId) return;
        const fetchPost = async () => {
            setIsLoading(true);
            const result = await getBlogPostByIdAction(postId);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
                router.push('/dashboard/admin/blog');
            } else if (result.post) {
                setPost(result.post);
            }
            setIsLoading(false);
        };
        fetchPost();
    }, [postId, toast, router]);

    const handleFieldChange = (field: keyof BlogPost, value: any) => {
        setPost(prev => prev ? { ...prev, [field]: value } : null);
    };
    
    const handleSectionChange = (index: number, field: 'heading' | 'content', value: string) => {
        setPost(prev => {
            if (!prev || !prev.sections) return prev;
            const newSections = [...prev.sections];
            newSections[index] = { ...newSections[index], [field]: value };
            return { ...prev, sections: newSections };
        });
    };

    const handleSave = () => {
        if (!post) return;
        startTransition(async () => {
            // We only send the fields that can be edited
            const updateData = {
                title: post.title,
                introduction: post.introduction,
                conclusion: post.conclusion,
                category: post.category,
                status: post.status,
                sections: post.sections,
                slug: post.slug,
                featuredImageUrl: post.featuredImageUrl,
                featuredImageHint: post.featuredImageHint,
                suggestedTags: post.suggestedTags,
            };

            const result = await updateBlogPostAction(postId, updateData as BlogPost);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error al Guardar', description: result.error });
            } else {
                toast({ title: 'Éxito', description: '¡Artículo actualizado con éxito!' });
                router.push('/dashboard/admin/blog');
            }
        });
    };
    
    if (isLoading) {
        return (
            <div>
                 <Skeleton className="h-8 w-48 mb-6" />
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                             <Skeleton className="h-4 w-24" />
                             <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                             <Skeleton className="h-4 w-24" />
                             <Skeleton className="h-20 w-full" />
                        </div>
                        <div className="flex justify-end">
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </CardContent>
                 </Card>
            </div>
        );
    }
    
    if (!post) {
        return <div>No se encontró la entrada del blog.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">Editar Entrada</h1>
                <Button variant="outline" asChild>
                    <Link href="/dashboard/admin/blog">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Contenido del Artículo</CardTitle>
                    <CardDescription>Realiza cambios en el contenido del artículo. Los cambios en las imágenes deben hacerse desde la suite de contenido IA.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Título</Label>
                            <Input id="title" value={post.title || ''} onChange={(e) => handleFieldChange('title', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="slug">Slug (URL)</Label>
                            <Input id="slug" value={post.slug || ''} onChange={(e) => handleFieldChange('slug', e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Categoría</Label>
                             <Select value={post.category} onValueChange={(value) => handleFieldChange('category', value)}>
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Elige una categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Legal">Legal</SelectItem>
                                    <SelectItem value="Vivienda">Vivienda</SelectItem>
                                    <SelectItem value="Noticias">Noticias</SelectItem>
                                    <SelectItem value="Trabajo">Trabajo</SelectItem>
                                    <SelectItem value="Integración">Integración</SelectItem>
                                    <SelectItem value="Cultura">Cultura</SelectItem>
                                    <SelectItem value="Emprendimiento">Emprendimiento</SelectItem>
                                    <SelectItem value="Finanzas">Finanzas</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Estado</Label>
                            <Select value={post.status} onValueChange={(value) => handleFieldChange('status', value)}>
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Elige un estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Draft">Borrador</SelectItem>
                                    <SelectItem value="In Review">En Revisión</SelectItem>
                                    <SelectItem value="Published">Publicado</SelectItem>
                                    <SelectItem value="Archived">Archivado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="introduction">Introducción</Label>
                        <Textarea id="introduction" value={post.introduction || ''} onChange={(e) => handleFieldChange('introduction', e.target.value)} rows={4} />
                    </div>

                    {post.sections?.map((section, index) => (
                        <Card key={index} className="bg-secondary/50">
                            <CardHeader>
                                <CardTitle className="text-lg">Sección {index + 1}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`section-heading-${index}`}>Encabezado</Label>
                                    <Input id={`section-heading-${index}`} value={section.heading} onChange={(e) => handleSectionChange(index, 'heading', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`section-content-${index}`}>Contenido</Label>
                                    <Textarea id={`section-content-${index}`} value={section.content} onChange={(e) => handleSectionChange(index, 'content', e.target.value)} rows={6} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                     <div className="space-y-2">
                        <Label htmlFor="conclusion">Conclusión</Label>
                        <Textarea id="conclusion" value={post.conclusion || ''} onChange={(e) => handleFieldChange('conclusion', e.target.value)} rows={4} />
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Cambios
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
