
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { generateBlogIdeasAction, generateIntelligentArticleAction } from '@/lib/ai-actions';
import { createBlogPostAction } from '@/lib/blog-actions';
import { Loader2, Sparkles, Wand2, Image as ImageIcon, Tags, Code, Save, Send, TestTube2 } from 'lucide-react';
import type { IntelligentArticle } from '@/lib/types';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


export default function AdminContentSuitePage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, userProfile } = useAuth();
    const [isPending, startTransition] = useTransition();
    const [isSaving, setIsSaving] = useState(false);
    
    // State for ideas generator
    const [ideasResult, setIdeasResult] = useState<string[]>([]);
    const [ideasTopic, setIdeasTopic] = useState('');
    const [ideasKeywords, setIdeasKeywords] = useState('');

    // State for article generator
    const [articleTopic, setArticleTopic] = useState('');
    const [articleCategory, setArticleCategory] = useState('');
    const [articleTone, setArticleTone] = useState('');
    const [articleLength, setArticleLength] = useState('');
    const [articleResult, setArticleResult] = useState<IntelligentArticle | null>(null);

    const handleGenerateIdeas = () => {
        startTransition(async () => {
            const result = await generateBlogIdeasAction({ communityDescription: ideasTopic, keywords: ideasKeywords, numIdeas: 5 });
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else {
                setIdeasResult(result.ideas || []);
                toast({ title: 'Éxito', description: '¡Nuevas ideas para el blog generadas!' });
            }
        });
    };

    const handleGenerateArticle = () => {
        if (!articleTopic || !articleCategory || !articleTone || !articleLength) {
            toast({ variant: 'destructive', title: 'Campos Incompletos', description: 'Por favor, rellena todos los campos para generar el artículo.' });
            return;
        }
        startTransition(async () => {
            setArticleResult(null);
            const result = await generateIntelligentArticleAction({
                topic: articleTopic,
                category: articleCategory,
                tone: articleTone,
                length: articleLength,
            });

            if (result.error) {
                toast({ variant: 'destructive', title: 'Error de IA', description: result.error });
            } else if (result.article) {
                setArticleResult(result.article);
                toast({ title: 'Éxito', description: '¡Nuevo artículo inteligente generado!' });
            }
        });
    };

    const handleGenerateFakeArticle = () => {
        const fakeArticle: IntelligentArticle = {
            title: "Artículo de Prueba para Depuración",
            introduction: "Esta es una introducción generada localmente para probar la funcionalidad de guardado sin llamar a la API de Gemini.",
            featuredImageUrl: "https://placehold.co/1200x600.png",
            featuredImageHint: "debug test",
            sections: [
                {
                    heading: "Sección de Prueba 1",
                    content: "Este es el contenido para la primera sección de prueba. Su propósito es verificar que los datos se guardan correctamente en Firestore.",
                    imageUrl: "https://placehold.co/800x400.png",
                    imageHint: "test section"
                },
                {
                    heading: "Sección de Prueba 2",
                    content: "Este es el contenido para la segunda sección. Contiene texto de relleno para simular un artículo real.",
                    imageUrl: "https://placehold.co/800x400.png",
                    imageHint: "another test"
                }
            ],
            conclusion: "Esta es la conclusión del artículo de prueba. Si puedes leer esto en la base de datos, la prueba ha sido un éxito.",
            suggestedTags: ["depuración", "prueba", "firestore"]
        };
        setArticleResult(fakeArticle);
        setArticleCategory("Noticias"); // Set a default category for the test
        toast({ title: 'Éxito', description: '¡Artículo de prueba generado! Listo para guardar.' });
    };
    
    const handleSaveArticle = async (status: 'Draft' | 'Published') => {
        if (!articleResult || !user || !userProfile) {
            toast({ variant: 'destructive', title: 'Error', description: 'No hay artículo para guardar o no estás autenticado.' });
            return;
        };

        setIsSaving(true);
        
        try {
            // Force token refresh to ensure security rules have the latest claims.
            await user.getIdToken(true);

            const postData = {
                ...articleResult,
                category: articleCategory || "General", // Use selected category or a default
                status: status,
            }

            const result = await createBlogPostAction(postData, user.uid, userProfile.name || "Admin");

            if (result.error) {
                toast({ variant: 'destructive', title: 'Error al Guardar', description: result.error });
            } else {
                toast({ title: 'Éxito', description: `Artículo guardado como ${status === 'Draft' ? 'borrador' : 'publicado'}.` });
                router.push('/dashboard/admin/blog');
            }
        } catch (error) {
             const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
             toast({ variant: 'destructive', title: 'Error Inesperado', description: errorMessage });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Suite de Contenido IA</h1>
            </div>
            <Tabs defaultValue="articles" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="ideas">1. Generador de Ideas</TabsTrigger>
                    <TabsTrigger value="articles">2. Generador de Artículos</TabsTrigger>
                </TabsList>

                <TabsContent value="ideas">
                    <Card>
                        <CardHeader>
                            <CardTitle>Generar Ideas para Blog</CardTitle>
                            <CardDescription>Si no sabes sobre qué escribir, obtén una lista de posibles ideas para publicaciones de blog.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="ideas-topic">Tema General</Label>
                                <Input id="ideas-topic" placeholder="ej., Cultura gastronómica colombiana en España" value={ideasTopic} onChange={e => setIdeasTopic(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ideas-keywords">Palabras Clave (opcional)</Label>
                                <Input id="ideas-keywords" placeholder="ej., arepas, bandeja paisa, inmigración" value={ideasKeywords} onChange={e => setIdeasKeywords(e.target.value)} />
                            </div>
                            <Button onClick={handleGenerateIdeas} disabled={isPending || !ideasTopic}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                Generar Ideas
                            </Button>
                            {ideasResult.length > 0 && (
                                <Card className="mt-4 bg-secondary">
                                    <CardHeader><CardTitle>Ideas Generadas</CardTitle></CardHeader>
                                    <CardContent>
                                        <ul className="list-disc pl-5 space-y-2">
                                            {ideasResult.map((idea, i) => <li key={i}>{idea}</li>)}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="articles">
                    <Card>
                        <CardHeader>
                            <CardTitle>Generar un Artículo Inteligente</CardTitle>
                            <CardDescription>Introduce un tema y deja que la IA investigue, busque imágenes y escriba un borrador de artículo optimizado.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="article-topic">Tema del Artículo</Label>
                                <Textarea id="article-topic" placeholder="ej., Cómo empadronarse en Madrid siendo colombiano y qué documentos se necesitan" value={articleTopic} onChange={e => setArticleTopic(e.target.value)} rows={3} />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="article-category">Categoría</Label>
                                    <Select value={articleCategory} onValueChange={setArticleCategory}>
                                        <SelectTrigger id="article-category">
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
                                    <Label htmlFor="article-tone">Tono</Label>
                                     <Select value={articleTone} onValueChange={setArticleTone}>
                                        <SelectTrigger id="article-tone">
                                            <SelectValue placeholder="Elige un tono" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Profesional">Profesional</SelectItem>
                                            <SelectItem value="Amigable">Amigable</SelectItem>
                                            <SelectItem value="Formal">Formal</SelectItem>
                                            <SelectItem value="Informativo">Informativo</SelectItem>
                                            <SelectItem value="Inspirador">Inspirador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="article-length">Extensión</Label>
                                     <Select value={articleLength} onValueChange={setArticleLength}>
                                        <SelectTrigger id="article-length">
                                            <SelectValue placeholder="Elige una extensión" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Corto">Corto (~300 palabras)</SelectItem>
                                            <SelectItem value="Medio">Medio (~800 palabras)</SelectItem>
                                            <SelectItem value="Largo">Largo (~1500+ palabras)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button onClick={handleGenerateArticle} disabled={isPending || isSaving || !articleTopic}>
                                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                    Generar Artículo
                                </Button>
                                <Button onClick={handleGenerateFakeArticle} disabled={isPending || isSaving} variant="outline">
                                    <TestTube2 className="mr-2 h-4 w-4" />
                                    Generar Artículo de Prueba
                                </Button>
                            </div>

                            {isPending && (
                                <div className="text-center p-8 space-y-4">
                                     <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                     <p className="text-muted-foreground">La IA está investigando y escribiendo... Esto puede tardar un momento.</p>
                                </div>
                            )}

                           {articleResult && !isPending && (
                                <>
                                <Card className="mt-6 bg-secondary">
                                    <CardHeader>
                                        <CardTitle className="font-headline text-2xl mb-2">{articleResult.title}</CardTitle>
                                        <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                                            <Image 
                                                src={articleResult.featuredImageUrl || 'https://placehold.co/1200x600.png'}
                                                alt={articleResult.title}
                                                fill
                                                className="object-cover"
                                                data-ai-hint={articleResult.featuredImageHint}
                                            />
                                            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                                Imagen Destacada
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <p className="text-lg italic">{articleResult.introduction}</p>
                                            {articleResult.sections.map((section, index) => (
                                                <div key={index} className="mt-6">
                                                    <h3 className="text-xl font-bold font-headline">{section.heading}</h3>
                                                    {section.imageUrl && section.imageHint && (
                                                        <div className="relative w-full h-56 my-4 rounded-lg overflow-hidden">
                                                            <Image
                                                                src={section.imageUrl}
                                                                alt={section.heading}
                                                                fill
                                                                className="object-cover"
                                                                data-ai-hint={section.imageHint}
                                                            />
                                                        </div>
                                                    )}
                                                    <p>{section.content}</p>
                                                </div>
                                            ))}
                                            <h3 className="text-xl font-bold font-headline mt-6">Conclusión</h3>
                                            <p>{articleResult.conclusion}</p>
                                        </div>
                                        {articleResult.suggestedTags && articleResult.suggestedTags.length > 0 && (
                                            <div className="border-t pt-4">
                                                <h4 className="flex items-center text-sm font-semibold mb-2">
                                                    <Tags className="w-4 h-4 mr-2" />
                                                    Etiquetas Sugeridas
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {articleResult.suggestedTags.map(tag => (
                                                        <Badge key={tag} variant="secondary">{tag}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                         <div className="flex justify-end mt-4 gap-2">
                                            <Button variant="outline" onClick={() => handleSaveArticle('Draft')} disabled={isSaving}>
                                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                                                Guardar como Borrador
                                            </Button>
                                            <Button onClick={() => handleSaveArticle('Published')} disabled={isSaving}>
                                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                                                Guardar y Publicar
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Collapsible className="mt-4">
                                    <CollapsibleTrigger asChild>
                                        <Button variant="outline" className="w-full">
                                            <Code className="mr-2" />
                                            Mostrar/Ocultar Respuesta JSON de la IA
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <Card className="mt-2 bg-black/80 text-white">
                                            <CardHeader>
                                                <CardTitle className="text-base text-white">Respuesta JSON de la IA</CardTitle>
                                                <CardDescription className="text-gray-400">Este es el objeto JSON exacto devuelto por el flujo de IA. Úsalo para depurar.</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <pre className="text-xs whitespace-pre-wrap break-all p-4 bg-black rounded-md overflow-x-auto">
                                                    {JSON.stringify(articleResult, null, 2)}
                                                </pre>
                                            </CardContent>
                                        </Card>
                                    </CollapsibleContent>
                                </Collapsible>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
