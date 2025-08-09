
import { getPublishedBlogPosts } from '@/lib/blog-actions';
import { getSavedBusinessesAction } from '@/lib/directory-actions';

const URL = 'https://www.miredcolombia.com';

function generateSiteMap(posts: any[], businesses: any[]) {
  const today = new Date().toISOString().split('T')[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <!-- Static pages -->
     <url>
       <loc>${URL}</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>${URL}/blog</loc>
       <lastmod>${today}</lastmod>
       <changefreq>weekly</changefreq>
       <priority>0.8</priority>
     </url>
     <url>
       <loc>${URL}/directory</loc>
       <lastmod>${today}</lastmod>
       <changefreq>weekly</changefreq>
       <priority>0.8</priority>
     </url>
     <url>
       <loc>${URL}/pricing</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.7</priority>
     </url>
      <url>
       <loc>${URL}/legal/privacy</loc>
       <lastmod>2024-01-01</lastmod>
       <changefreq>yearly</changefreq>
       <priority>0.3</priority>
     </url>
     <url>
       <loc>${URL}/legal/terms</loc>
       <lastmod>2024-01-01</lastmod>
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
           <priority>0.9</priority>
       </url>
     `;
       })
       .join('')}

     <!-- Dynamic business pages -->
     ${businesses
       .map(({ id }) => {
         return `
       <url>
           <loc>${`${URL}/directory/${id}`}</loc>
           <lastmod>${today}</lastmod> 
           <changefreq>monthly</changefreq>
           <priority>0.6</priority>
       </url>
     `;
       })
       .join('')}
   </urlset>
 `;
}

export async function GET() {
  // Fetch data
  const { posts } = await getPublishedBlogPosts();
  const { businesses } = await getSavedBusinessesAction(true);

  // Generate the sitemap
  const body = generateSiteMap(posts || [], businesses || []);

  return new Response(body, {
    status: 200,
    headers: {
      'Cache-control': 'public, s-maxage=86400, stale-while-revalidate',
      'content-type': 'application/xml',
    },
  });
}
