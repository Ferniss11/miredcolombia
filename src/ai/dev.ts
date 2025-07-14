import { config } from 'dotenv';
config();

import '@/ai/flows/generate-blog-ideas.ts';
import '@/ai/flows/generate-blog-title.ts';
import '@/ai/flows/generate-intelligent-article.ts';
import '@/ai/flows/chat-flow.ts';
import '@/ai/tools/unsplash-search.ts';
import '@/ai/tools/web-search.ts';
import '@/ai/tools/knowledge-base-search.ts';
