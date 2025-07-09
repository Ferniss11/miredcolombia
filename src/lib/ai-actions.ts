
'use server';

import { z } from 'zod';
import { generateBlogIdeas } from '@/ai/flows/generate-blog-ideas';
import { generateBlogTitle } from '@/ai/flows/generate-blog-title';
import { generateIntelligentArticle } from '@/ai/flows/generate-intelligent-article';
import { GenerateArticleInputSchema, GenerateBlogIdeasInputSchema, GenerateBlogTitleInputSchema, type GenerateArticleInput, type GenerateBlogIdeasInput, type GenerateBlogTitleInput } from '@/lib/types';


export async function generateBlogIdeasAction(input: GenerateBlogIdeasInput) {
    try {
        const validatedInput = GenerateBlogIdeasInputSchema.parse(input);
        const result = await generateBlogIdeas(validatedInput);
        return { ideas: result.ideas };
    } catch (error) {
        console.error(error);
        return { error: 'Error al generar ideas para el blog.' };
    }
}

export async function generateBlogTitleAction(input: GenerateBlogTitleInput) {
    try {
        const validatedInput = GenerateBlogTitleInputSchema.parse(input);
        const result = await generateBlogTitle(validatedInput);
        return { title: result.title };
    } catch (error) {
        console.error(error);
        return { error: 'Error al generar el título del blog.' };
    }
}

export async function generateIntelligentArticleAction(input: GenerateArticleInput) {
    try {
        const validatedInput = GenerateArticleInputSchema.parse(input);
        const result = await generateIntelligentArticle(validatedInput);
        
        return { article: result };

    } catch (error) {
        console.error('Error al generar el artículo:', error);
        const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió.';
        return { error: `Error al generar el contenido del blog: ${errorMessage}` };
    }
}
