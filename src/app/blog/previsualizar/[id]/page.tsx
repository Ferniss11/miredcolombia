
import { getBlogPostByIdAction } from "@/lib/blog-actions";
import { notFound } from "next/navigation";
import { Calendar, User, Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// This page is not statically generated, it's for dynamic previews.
// We should probably add some auth protection here in a real app.

export default async function BlogPostPreviewPage({ params }: { params: { id: string } }) {
  const { post } = await getBlogPostByIdAction(params.id);

  if (!post) {
    notFound();
  }

  return (
    <div className="relative">
      <Alert className="sticky top-0 z-10 rounded-none border-x-0 border-t-0 bg-yellow-100 text-yellow-900 border-yellow-300">
        <Eye className="h-4 w-4 !text-yellow-900" />
        <AlertTitle>Modo Previsualización</AlertTitle>
        <AlertDescription>
          Así es como se verá tu artículo. <Link href={`/dashboard/admin/blog/edit/${post.id}`} className="font-bold underline">Vuelve al editor</Link> o publica los cambios.
        </AlertDescription>
      </Alert>
    <article className="container mx-auto px-4 py-12 md:px-6 max-w-4xl">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mt-4">{post.title}</h1>
        <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground mt-4 font-body">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1.5" />
            <span>Publicado el {new Date(post.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center">
            <User className="w-4 h-4 mr-1.5" />
            <span>Por {post.author}</span>
          </div>
        </div>
      </header>
      
      {post.featuredImageUrl && (
        <Image
            src={post.featuredImageUrl}
            alt={post.title}
            width={1200}
            height={600}
            data-ai-hint={post.featuredImageHint || 'blog post topic'}
            className="w-full h-auto rounded-lg shadow-lg object-cover mb-8"
            priority
        />
      )}

      <div className="prose dark:prose-invert max-w-none font-body text-lg leading-relaxed">
        <p className="text-xl italic text-muted-foreground">{post.introduction}</p>
        
        {post.sections.map((section, index) => (
            <section key={index} className="mt-8">
                <h2 className="font-headline text-2xl md:text-3xl">{section.heading}</h2>
                {section.imageUrl && (
                     <Image
                        src={section.imageUrl}
                        alt={section.heading}
                        width={800}
                        height={400}
                        data-ai-hint={section.imageHint || 'section image'}
                        className="w-full h-auto rounded-lg shadow-md object-cover my-4"
                    />
                )}
                <div dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br />') }} />
            </section>
        ))}

        <h2 className="font-headline text-2xl md:text-3xl mt-8">Conclusión</h2>
        <p>{post.conclusion}</p>
      </div>

       {post.suggestedTags && post.suggestedTags.length > 0 && (
        <div className="mt-8 pt-4 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">Etiquetas</h3>
          <div className="flex flex-wrap gap-2">
            {post.suggestedTags.map((tag) => (
              <span key={tag} className="bg-secondary text-secondary-foreground text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 text-center">
        <Button asChild>
            <Link href="/dashboard/admin/blog">
                Volver al Gestor
            </Link>
        </Button>
      </div>
    </article>
    </div>
  );
}
