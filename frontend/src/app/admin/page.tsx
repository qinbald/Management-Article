'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminSkeleton } from '@/components/Skeleton';

interface UserItem {
  id: number;
  username: string;
  email: string;
  role: string;
  is_blocked: boolean;
  warning_count: number;
  created_at: string;
}

interface ArticleItem {
  id: number;
  title: string;
  author: string;
  is_locked: boolean;
  published_at: string;
}

interface Stats {
  total_users: number;
  total_articles: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'articles'>('articles');

  const fetchAdmin = async () => {
    try {
      const res = await fetch('/api/flask/admin_dashboard', {
        credentials: 'include',
      });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (res.status === 403) {
        setError('AKSES DITOLAK — HANYA ADMIN');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users);
        setArticles(data.data.articles);
        setStats(data.stats);
      } else {
        setError(data.messages || 'Gagal memuat data');
      }
    } catch {
      setError('Kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmin();
  }, [router]);

  const handleAction = async (url: string, method: string = 'POST', body?: any) => {
    if (method === 'DELETE' && !confirm('Yakin ingin menghapus?')) return;
    try {
      const options: RequestInit = { method, credentials: 'include' };
      if (body) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
      }
      const res = await fetch(`/api/flask${url}`, options);
      const data = await res.json();
      if (data.success) {
        fetchAdmin();
      } else {
        alert(data.messages);
      }
    } catch {
      alert('Terjadi kesalahan jaringan');
    }
  };

  const handleWarn = (userId: number) => {
    const reason = prompt('Masukkan alasan peringatan:');
    if (reason === null) return; // Cancelled
    handleAction(`/api/admin/users/${userId}/warn`, 'POST', { reason });
  };

  if (loading) return <AdminSkeleton />;
  if (error) return <div className="text-center py-20 font-semibold text-tertiary">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="glass-card p-6 text-center">
          <div className="text-4xl font-extrabold text-primary">{stats?.total_users ?? 0}</div>
          <div className="text-xs font-semibold uppercase text-foreground/50 mt-1">TOTAL PENGGUNA</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-4xl font-extrabold text-primary">{stats?.total_articles ?? 0}</div>
          <div className="text-xs font-semibold uppercase text-foreground/50 mt-1">TOTAL ARTIKEL</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 pb-2">
        <button 
          onClick={() => setActiveTab('articles')}
          className={`px-4 py-2 font-bold text-sm transition-colors ${activeTab === 'articles' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          MANAJEMEN ARTIKEL
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-bold text-sm transition-colors ${activeTab === 'users' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          MANAJEMEN PENGGUNA
        </button>
      </div>

      {/* Content */}
      <div className="glass-card p-8 relative">
        <div className="absolute -top-3 left-6 bg-tertiary/20 text-tertiary font-semibold px-4 py-1 rounded-full border border-tertiary/30 text-xs backdrop-blur-md">
          {activeTab === 'articles' ? 'ARTIKEL' : 'PENGGUNA'}
        </div>

        {activeTab === 'articles' && (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-2 text-xs font-semibold uppercase text-slate-500">ID</th>
                  <th className="py-3 px-2 text-xs font-semibold uppercase text-slate-500">JUDUL</th>
                  <th className="py-3 px-2 text-xs font-semibold uppercase text-slate-500">PENULIS</th>
                  <th className="py-3 px-2 text-xs font-semibold uppercase text-slate-500">STATUS</th>
                  <th className="py-3 px-2 text-xs font-semibold uppercase text-slate-500 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-2 text-sm font-semibold text-slate-500">{a.id}</td>
                    <td className="py-3 px-2 text-sm font-bold text-slate-900 line-clamp-1">{a.title}</td>
                    <td className="py-3 px-2 text-sm text-slate-600">{a.author}</td>
                    <td className="py-3 px-2">
                      {a.is_locked ? (
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-700">DIKUNCI</span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-100 text-emerald-700">PUBLIK</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right space-x-2">
                      <Link href={`/articles/${a.id}`} className="text-xs font-bold text-blue-600 hover:underline">LIHAT</Link>
                      <button onClick={() => handleAction(`/api/admin/articles/${a.id}/toggle-lock`)} className="text-xs font-bold text-amber-600 hover:underline">
                        {a.is_locked ? 'BUKA' : 'KUNCI'}
                      </button>
                      <button onClick={() => handleAction(`/api/admin/articles/${a.id}`, 'DELETE')} className="text-xs font-bold text-red-600 hover:underline">HAPUS</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-2 text-xs font-semibold uppercase text-slate-500">ID</th>
                  <th className="py-3 px-2 text-xs font-semibold uppercase text-slate-500">USERNAME</th>
                  <th className="py-3 px-2 text-xs font-semibold uppercase text-slate-500">ROLE</th>
                  <th className="py-3 px-2 text-xs font-semibold uppercase text-slate-500">STATUS</th>
                  <th className="py-3 px-2 text-xs font-semibold uppercase text-slate-500">WARNINGS</th>
                  <th className="py-3 px-2 text-xs font-semibold uppercase text-slate-500 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-2 text-sm font-semibold text-slate-500">{u.id}</td>
                    <td className="py-3 px-2 text-sm font-bold text-slate-900">{u.username}</td>
                    <td className="py-3 px-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {u.is_blocked ? (
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-700">DIBLOKIR</span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-100 text-emerald-700">AKTIF</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-sm font-bold text-amber-600">{u.warning_count}</td>
                    <td className="py-3 px-2 text-right space-x-2">
                      {u.role !== 'admin' && (
                        <>
                          <button onClick={() => handleWarn(u.id)} className="text-xs font-bold text-amber-600 hover:underline">WARN</button>
                          {u.warning_count > 0 && (
                            <>
                              <button onClick={() => handleAction(`/api/admin/users/${u.id}/reduce-warning`)} className="text-xs font-bold text-emerald-600 hover:underline">-1 WARN</button>
                              <button onClick={() => { if (confirm('Hapus semua peringatan?')) handleAction(`/api/admin/users/${u.id}/clear-warnings`); }} className="text-xs font-bold text-blue-600 hover:underline">CLEAR</button>
                            </>
                          )}
                          <button onClick={() => handleAction(`/api/admin/users/${u.id}/toggle-block`)} className="text-xs font-bold text-slate-600 hover:underline">
                            {u.is_blocked ? 'UNBLOCK' : 'SUSPEND'}
                          </button>
                          <button onClick={() => handleAction(`/api/admin/users/${u.id}`, 'DELETE')} className="text-xs font-bold text-red-600 hover:underline">HAPUS</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
