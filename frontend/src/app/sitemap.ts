import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://artikelspace.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch artikel dari Flask API (server-side, no proxy needed)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  let articles: { id: number; published_at: string }[] = [];
  try {
    const res = await fetch(`${backendUrl}/get_articles`, {
      next: { revalidate: 3600 }, // ISR: regenerate tiap 1 jam
    });
    const data = await res.json();
    if (data.success) articles = data.data;
  } catch {
    // Fallback: sitemap tanpa artikel jika backend mati
  }

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/login`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/register`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/analytics`, changeFrequency: 'weekly', priority: 0.6 },
  ];

  const articlePages: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/articles/${a.id}`,
    lastModified: new Date(a.published_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...articlePages];
}
