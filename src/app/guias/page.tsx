
import BlogPage from "../blog/page";

export default function GuiasPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-headline">Guías Prácticas</h1>
            <p className="text-lg text-muted-foreground mt-2 font-body max-w-2xl mx-auto">
            Guías prácticas paso a paso para colombianos en España.
            </p>
        </div>
        {/* We can reuse the existing BlogPage component which already lists posts */}
        {/* @ts-expect-error Server Component */}
        <BlogPage />
    </div>
  );
}
