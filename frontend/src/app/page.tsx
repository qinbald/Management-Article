'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('Semua');

  const fetchArticles = async (q = '', cat = 'Semua') => {
    setLoading(true);
    try {
      const url = new URL('http://localhost:3000/api/flask/get_articles');
      if (q) url.searchParams.append('q', q);
      if (cat && cat !== 'Semua') url.searchParams.append('category', cat);
      
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setArticles(data.data);
      } else {
        setError('GAGAL MEMUAT ARTIKEL');
      }
    } catch {
      setError('KESALAHAN JARINGAN');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles(searchQuery, category);
  };

  if (loading && articles.length === 0) return <div className="text-center py-20 font-bold uppercase tracking-widest text-primary">MEMUAT DATA...</div>;
  if (error) return <div className="text-center py-20 font-bold text-tertiary uppercase">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Header Grunge Style */}
      <div className="border-4 border-primary p-6 md:p-10 mb-8 bg-neutral shadow-[8px_8px_0px_#2E2E2E] relative overflow-hidden">
        <div className="absolute top-2 right-2 bg-secondary text-primary font-bold text-xs px-2 py-1 uppercase border border-primary transform rotate-3">
          EST. 1990s
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-primary mb-4">
          ZINE ARTIKEL & ARSIP
        </h1>
        <p className="text-base text-primary/80 max-w-2xl leading-relaxed mb-6 font-medium">
          Koleksi tulisan mentah, arsip pemikiran, dan dokumen ensiklopedia terbuka. Dibangun tanpa ornamen palsu.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/articles/create" className="grunge-button px-6 py-3 text-sm inline-block">
            + TULIS ARTIKEL
          </Link>
          <Link href="/articles/import" className="grunge-button-secondary px-6 py-3 text-sm inline-block">
            IMPOR WIKIPEDIA
          </Link>
        </div>
      </div>

      {/* Search & Filter */}
      <form onSubmit={handleSearch} className="mb-12 flex flex-col md:flex-row gap-4 bg-neutral p-4 border-4 border-primary shadow-[4px_4px_0px_#2E2E2E]">
        <input 
          type="text" 
          placeholder="CARI ARTIKEL..." 
          className="grunge-input flex-1"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select 
          className="grunge-input md:w-48"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="Semua">SEMUA KATEGORI</option>
          <option value="Berita Pendek">BERITA PENDEK</option>
          <option value="Teknologi">TEKNOLOGI</option>
          <option value="Sejarah">SEJARAH</option>
          <option value="Gaya Hidup">GAYA HIDUP</option>
          <option value="Sains">SAINS</option>
          <option value="Umum">UMUM</option>
        </select>
        <button type="submit" className="grunge-button px-6 py-3">
          CARI
        </button>
      </form>

      {/* Article List / Grid */}
      {articles.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-primary bg-neutral">
          <p className="font-bold text-primary uppercase">BELUM ADA DOKUMEN DALAM ARSIP.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, idx) => (
            <Link key={article.id} href={`/articles/${article.id}`} className="group block">
              <div className={`grunge-card p-6 h-full flex flex-col justify-between ${idx % 2 === 0 ? 'rotate-[-0.5deg]' : 'rotate-[0.5deg]'}`}>
                <div>
                  <div className="flex justify-between items-start mb-3 border-b-2 border-primary pb-2">
                    <span className="text-xs font-bold uppercase bg-secondary px-2 py-0.5 border border-primary text-primary">
                      {article.category || 'UMUM'}
                    </span>
                    <span className="text-xs font-bold text-primary/70">{article.published_at?.slice(0, 10)}</span>
                  </div>
                  <h2 className="text-xl font-bold uppercase text-primary mb-3 group-hover:text-tertiary transition leading-snug line-clamp-2">
                    {article.title}
                  </h2>
                  <p className="text-sm text-primary/80 line-clamp-4 leading-relaxed mb-6 font-normal">
                    {article.description}
                  </p>
                </div>
                <div className="border-t-2 border-primary pt-3 flex justify-between items-center text-xs font-bold text-primary uppercase">
                  <span>PENULIS: {article.author}</span>
                  <span className="group-hover:translate-x-1 transition">&rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
