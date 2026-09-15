import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://artikelspace.com';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/profile/', '/articles/create', '/articles/import'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
