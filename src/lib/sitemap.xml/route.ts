

import { getPublishedBlogPosts } from '@/lib/blog-actions';
import { getSavedBusinessesAction } from '@/lib/directory-actions';
import { getPublicJobPostingsAction } from '@/lib/job-posting/infrastructure/nextjs/job-posting.server-actions';
import { JobPosting } from '@/lib/types';
import { getPublicPropertiesAction } from '@/lib/real-estate/infrastructure/nextjs/property.server-actions';
import { Property } from '@/lib/real-estate/domain/property.entity';

const URL = 'https://www.miredcolombia.com';

function generateSiteMap(posts: any[], businesses: any[], jobs: JobPosting[], properties: Property[]) {
  const today = new Date().toISOString().split('T')[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <!-- Static pages -->
     <url>
       <loc>${URL}</loc>
       <lastmod>${today}</lastmod>
       <changefreq>daily</changefreq>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>${URL}/directorio</loc>
       <lastmod>${today}</lastmod>
       <changefreq>weekly</changefreq>
       <priority>0.8</priority>
     </url>
      <url>
       <loc>${URL}/empleos</loc>
       <lastmod>${today}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.9</priority>
     </url>
     <url>
       <loc>${URL}/inmobiliaria</loc>
       <lastmod>${today}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.9</priority>
     </url>
     <url>
       <loc>${URL}/blog</loc>
       <lastmod>${today}</lastmod>
       <changefreq>weekly</changefreq>
       <priority>0.8</priority>
     </url>
     <url>
       <loc>${URL}/precios</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.7</priority>
     </url>
      <url>
       <loc>${URL}/legal/privacidad</loc>
       <lastmod>2024-07-09</lastmod>
       <changefreq>yearly</changefreq>
       <priority>0.3</priority>
     </url>
     <url>
       <loc>${URL}/legal/terminos</loc>
       <lastmod>2024-07-09</lastmod>
       <changefreq>yearly</changefreq>
       <priority>0.3</priority>
     </url>

     <!-- Dynamic blog posts -->
     ${posts
       .map(({ slug, date }) => {
         return `
       <url>
           <loc>${`${URL}/blog/${slug}`}</loc>
           <lastmod>${new Date(date).toISOString().split('T')[0]}</lastmod>
           <changefreq>never</changefreq>
           <priority>0.7</priority>
       </url>
     `;
       })
       .join('')}

     <!-- Dynamic business pages -->
     ${businesses
       .map(({ id }) => {
         return `
       <url>
           <loc>${`${URL}/directorio/${id}`}</loc>
           <lastmod>${today}</lastmod> 
           <changefreq>monthly</changefreq>
           <priority>0.6</priority>
       </url>
     `;
       })
       .join('')}
       
      <!-- Dynamic job pages -->
     ${jobs
       .map(({ id, updatedAt }) => {
         return `
       <url>
           <loc>${`${URL}/empleos/${id}`}</loc>
           <lastmod>${new Date(updatedAt).toISOString().split('T')[0]}</lastmod> 
           <changefreq>weekly</changefreq>
           <priority>0.8</priority>
       </url>
     `;
       })
       .join('')}
     
      <!-- Dynamic property pages -->
     ${properties
       .map(({ id, updatedAt }) => {
         return `
       <url>
           <loc>${`${URL}/inmobiliaria/${id}`}</loc>
           <lastmod>${new Date(updatedAt).toISOString().split('T')[0]}</lastmod> 
           <changefreq>weekly</changefreq>
           <priority>0.8</priority>
       </url>
     `;
       })
       .join('')}
   </urlset>
 `;
}

export async function GET() {
  // Fetch all data in parallel
  const [
    { posts }, 
    { businesses }, 
    { data: jobs },
    { properties }
  ] = await Promise.all([
    getPublishedBlogPosts(),
    getSavedBusinessesAction(true),
    getPublicJobPostingsAction(),
    getPublicPropertiesAction()
  ]);

  // Generate the sitemap
  const body = generateSiteMap(posts || [], businesses || [], jobs || [], properties || []);

  return new Response(body, {
    status: 200,
    headers: {
      'Cache-control': 'public, s-maxage=86400, stale-while-revalidate',
      'content-type': 'application/xml',
    },
  });
}
