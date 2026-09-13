'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  total_articles: number;
}

interface ArticleItem {
  id: number;
  title: string;
  category: string;
  published_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/flask/profil_user', {
          credentials: 'include',
        });
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.success) {
          setProfile(data.user);
          setArticles(data.articles);
        } else {
          setError('Gagal memuat profil');
        }
      } catch {
        setError('Kesalahan jaringan');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus artikel ini?')) return;
    setDeleteId(id);
    try {
      const res = await fetch(`/api/flask/delete_article/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
        setProfile((prev) => prev ? { ...prev, total_articles: prev.total_articles - 1 } : prev);
      } else {
        alert(data.messages || 'Gagal menghapus');
      }
    } catch {
      alert('Kesalahan jaringan');
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) return <div className="text-center py-20 font-bold uppercase tracking-widest text-primary">MEMUAT PROFIL...</div>;
  if (error) return <div className="text-center py-20 font-bold text-tertiary uppercase">{error}</div>;
  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Kartu Profil */}
      <div className="bg-neutral border-4 border-primary shadow-[8px_8px_0px_#2E2E2E] p-8 relative">
        <div className="absolute -top-3 -left-3 bg-secondary text-primary font-bold px-3 py-1 border-2 border-primary transform -rotate-3 uppercase text-sm">
          PROFIL PENGGUNA
        </div>
        <div className="flex flex-wrap gap-6 items-start mt-4">
          <div className="w-20 h-20 bg-primary border-4 border-secondary flex items-center justify-center text-neutral text-3xl font-extrabold uppercase">
            {profile.username[0]}
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl font-extrabold uppercase text-primary">{profile.username}</h1>
            <p className="text-sm font-bold text-primary/70 uppercase">{profile.email}</p>
            <div className="flex gap-3 flex-wrap mt-2">
              <span className="text-xs font-bold bg-secondary text-primary px-3 py-1 border-2 border-primary uppercase">
                {profile.role}
              </span>
              <span className="text-xs font-bold bg-surface text-neutral px-3 py-1 border-2 border-primary uppercase">
                {profile.total_articles} ARTIKEL
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Daftar Artikel Milik User */}
      <div className="bg-neutral border-4 border-primary shadow-[8px_8px_0px_#2E2E2E] p-8">
        <h2 className="text-xl font-extrabold uppercase text-primary mb-6 border-b-4 border-primary pb-2">
          ARTIKEL SAYA
        </h2>
        {articles.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-primary">
            <p className="font-bold text-primary uppercase">BELUM ADA ARTIKEL.</p>
            <Link href="/articles/create" className="grunge-button inline-block mt-4 px-6 py-2 text-sm">
              + TULIS SEKARANG
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((art) => (
              <div key={art.id} className="flex items-center justify-between border-2 border-primary p-4 bg-white hover:bg-secondary/20 transition">
                <div className="flex-1 min-w-0">
                  <Link href={`/articles/${art.id}`} className="font-bold text-primary uppercase hover:text-tertiary transition line-clamp-1">
                    {art.title}
                  </Link>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs font-bold text-primary/60 uppercase">{art.category}</span>
                    <span className="text-xs font-bold text-primary/60">{art.published_at}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(art.id)}
                  disabled={deleteId === art.id}
                  className="ml-4 text-xs font-bold bg-tertiary text-neutral px-3 py-1.5 border-2 border-primary hover:bg-primary transition uppercase disabled:opacity-50 shrink-0"
                >
                  {deleteId === art.id ? '...' : 'HAPUS'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
