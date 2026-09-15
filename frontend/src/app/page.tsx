'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { StaggeredGrid } from '@/components/StaggeredGrid';
import { HomePageSkeleton } from '@/components/Skeleton';

interface Article {
  id: number;
  title: string;
  description: string;
  author: string;
  category: string;
  published_at: string;
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('Semua');

  const fetchArticles = async (q = '', cat = 'Semua') => {
    setLoading(true);
    try {
      const url = new URL('/api/flask/get_articles', window.location.origin);
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
    let mounted = true;
    const initFetch = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/flask/get_articles');
        const data = await res.json();
        if (mounted && data.success) {
          setArticles(data.data);
        } else if (mounted) {
          setError('GAGAL MEMUAT ARTIKEL');
        }
      } catch {
        if (mounted) setError('KESALAHAN JARINGAN');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    initFetch();
    return () => { mounted = false; };
  }, []);

  const CATEGORIES = [
    'Semua',
    'Sains & Teknologi',
    'Sejarah & Geografi',
    'Sosial & Budaya',
    'Kesehatan & Gaya Hidup',
    'Ekonomi & Bisnis',
    'Biografi',
    'Umum'
  ];

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    fetchArticles(searchQuery, cat);
  };

  const articlesRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles(searchQuery, category);
    articlesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading && articles.length === 0) return <HomePageSkeleton />;
  if (error) return <div className="text-center py-24 font-medium text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
        <h1 className="text-[30px] sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 sm:mb-6 leading-[1.15] sm:leading-tight text-balance">
          Pusat Pengetahuan & <span className="text-emerald-600">Wawasan Dunia</span>
        </h1>
        <p className="text-[15px] sm:text-lg text-slate-600 leading-relaxed mb-6 sm:mb-8 text-pretty px-1 sm:px-0">
          Platform kolaboratif untuk mendokumentasikan ide, berbagi temuan teknologi, dan menganalisis tren literasi secara <em className="font-medium text-slate-700">real-time</em>. Ruang terbuka untuk para inovator.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link href="/articles/create" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-300/50 hover:-translate-y-0.5 transition-all duration-300">
            Publikasikan Karya
          </Link>
          <Link href="/articles/import" className="w-full sm:w-auto bg-white/80 backdrop-blur-md text-emerald-700 hover:bg-white border border-emerald-200/60 font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-slate-200/40 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            Jelajah Wikipedia
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar — Glassmorphism + Floating */}
      <div className="max-w-4xl mx-auto mb-16 space-y-5">
        <form onSubmit={handleSearch}>
          <div className="bg-white/30 backdrop-blur-md border border-white/50 p-2 rounded-full shadow-xl shadow-slate-200/50 flex flex-col md:flex-row gap-2">
            <input 
              type="text" 
              placeholder="Cari artikel, riset, atau dokumentasi..." 
              className="flex-1 bg-transparent px-6 py-3 text-slate-900 placeholder-slate-400 focus:outline-none rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="w-px bg-white/50 hidden md:block my-2"></div>
            <select 
              className="bg-transparent px-4 py-3 text-slate-700 focus:outline-none cursor-pointer rounded-full md:w-56 text-sm"
              value={category}
              onChange={(e) => handleCategorySelect(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'Semua' ? 'Semua Kategori' : cat}
                </option>
              ))}
            </select>
            <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-8 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full md:w-auto">
              Temukan Topik
            </button>
          </div>
        </form>

        {/* Quick Category Filter Pills — Glass + Floating */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ease-in-out ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/50 border border-emerald-600'
                    : 'bg-white/30 backdrop-blur-md border border-white/50 text-slate-700 shadow-md shadow-slate-200/30 hover:-translate-y-1 hover:shadow-xl hover:bg-white/50 hover:border-white/70'
                }`}
              >
                {cat === 'Semua' ? 'Semua Kategori' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Article Grid */}
      <div ref={articlesRef} className="scroll-mt-24" />
      {articles.length === 0 ? (
        <div className="text-center py-20 bg-white/40 backdrop-blur-sm border border-slate-200 border-dashed rounded-3xl">
          <p className="font-medium text-slate-500">Belum ada dokumen yang ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <StaggeredGrid>
            {articles.map((article) => (
              <Link key={article.id} href={`/articles/${article.id}`} className="group block">
              <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 h-full flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCategorySelect(article.category || 'Umum');
                      }}
                      className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                    >
                      {article.category || 'Umum'}
                    </button>
                    <span className="text-xs font-medium text-slate-400">
                      {article.published_at ? new Date(article.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors leading-snug line-clamp-2">
                    {article.title}
                  </h2>
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-6">
                    {article.description}
                  </p>
                </div>
                <div className="pt-4 flex justify-between items-center text-xs font-medium text-slate-500 border-t border-slate-100">
                  <span className="truncate pr-4">Oleh {article.author}</span>
                  <span className="group-hover:translate-x-1 transition-transform text-emerald-600 font-semibold">&rarr;</span>
                </div>
              </div>
            </Link>
          ))}
          </StaggeredGrid>
        </div>
      )}
    </div>
  );
}
