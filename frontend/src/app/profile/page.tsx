'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProfileSkeleton } from '@/components/Skeleton';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  total_articles: number;
  warning_count: number;
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
  const [showPulse, setShowPulse] = useState(true);

  useEffect(() => {
    if (profile && profile.warning_count > 0) {
      const timer = setTimeout(() => setShowPulse(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [profile]);

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

  if (loading) return <ProfileSkeleton />;
  if (error) return <div className="text-center py-20 font-semibold text-tertiary">{error}</div>;
  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Kartu Profil */}
      <div className="glass-card p-8 relative">
        <div className="absolute -top-3 left-6 bg-primary/20 text-primary font-semibold px-4 py-1 rounded-full border border-primary/30 text-xs backdrop-blur-md">
          PROFIL PENGGUNA
        </div>
        <div className="flex flex-wrap gap-6 items-start mt-4">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-3xl font-extrabold shadow-lg ring-4 ring-emerald-100 shrink-0">
              {profile.username[0].toUpperCase()}
            </div>
            {profile.warning_count > 0 && (
              <>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md ring-2 ring-white z-10">
                  {profile.warning_count}
                </div>
                {showPulse && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full animate-ping opacity-75"></div>
                )}
              </>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl font-extrabold text-foreground">{profile.username}</h1>
            <p className="text-sm font-medium text-foreground/60">{profile.email}</p>
            <div className="flex gap-3 flex-wrap mt-2">
              <span className="text-xs font-semibold bg-primary/15 text-primary px-3 py-1 rounded-full border border-primary/30">
                {profile.role.toUpperCase()}
              </span>
              <span className="text-xs font-semibold bg-white/5 text-foreground/80 px-3 py-1 rounded-full border border-white/10">
                {profile.total_articles} ARTIKEL
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Daftar Artikel Milik User */}
      <div className="glass-card p-8">
        <h2 className="text-xl font-extrabold text-foreground mb-6 border-b border-white/10 pb-2">
          ARTIKEL SAYA
        </h2>
        {articles.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
            <p className="font-semibold text-foreground/60">BELUM ADA ARTIKEL.</p>
            <Link href="/articles/create" className="glass-button inline-block mt-4 px-6 py-2 text-sm">
              + TULIS SEKARANG
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((art) => (
              <div key={art.id} className="flex items-center justify-between border border-white/10 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition">
                <div className="flex-1 min-w-0">
                  <Link href={`/articles/${art.id}`} className="font-bold text-foreground hover:text-primary transition line-clamp-1">
                    {art.title}
                  </Link>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs font-medium text-foreground/50">{art.category}</span>
                    <span className="text-xs font-medium text-foreground/50">{art.published_at}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(art.id)}
                  disabled={deleteId === art.id}
                  className="ml-4 text-xs font-semibold bg-tertiary/20 text-tertiary px-3 py-1.5 rounded-lg border border-tertiary/30 hover:bg-tertiary/30 transition uppercase disabled:opacity-50 shrink-0"
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
