'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserItem {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

interface Stats {
  total_users: number;
  total_articles: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
          setUsers(data.data);
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
    fetchAdmin();
  }, [router]);

  if (loading) return <div className="text-center py-20 font-bold uppercase tracking-widest text-primary">MEMUAT PANEL ADMIN...</div>;
  if (error) return <div className="text-center py-20 font-bold text-tertiary uppercase">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-neutral border-4 border-primary shadow-[8px_8px_0px_#2E2E2E] p-6 text-center">
          <div className="text-4xl font-extrabold text-primary">{stats?.total_users ?? 0}</div>
          <div className="text-sm font-bold uppercase text-primary/70 mt-1">TOTAL PENGGUNA</div>
        </div>
        <div className="bg-neutral border-4 border-primary shadow-[8px_8px_0px_#2E2E2E] p-6 text-center">
          <div className="text-4xl font-extrabold text-primary">{stats?.total_articles ?? 0}</div>
          <div className="text-sm font-bold uppercase text-primary/70 mt-1">TOTAL ARTIKEL</div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-neutral border-4 border-primary shadow-[8px_8px_0px_#2E2E2E] p-8 relative">
        <div className="absolute -top-3 -left-3 bg-tertiary text-neutral font-bold px-3 py-1 border-2 border-primary transform -rotate-3 uppercase text-sm">
          ADMIN PANEL
        </div>
        <h2 className="text-xl font-extrabold uppercase text-primary mb-6 border-b-4 border-primary pb-2 mt-4">
          DAFTAR PENGGUNA
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-4 border-primary">
                <th className="py-3 px-2 text-xs font-bold uppercase text-primary">ID</th>
                <th className="py-3 px-2 text-xs font-bold uppercase text-primary">USERNAME</th>
                <th className="py-3 px-2 text-xs font-bold uppercase text-primary">EMAIL</th>
                <th className="py-3 px-2 text-xs font-bold uppercase text-primary">ROLE</th>
                <th className="py-3 px-2 text-xs font-bold uppercase text-primary">TERDAFTAR</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b-2 border-primary/30 hover:bg-secondary/20 transition">
                  <td className="py-3 px-2 text-sm font-bold text-primary">{u.id}</td>
                  <td className="py-3 px-2 text-sm font-bold text-primary uppercase">{u.username}</td>
                  <td className="py-3 px-2 text-sm text-primary/80">{u.email}</td>
                  <td className="py-3 px-2">
                    <span className={`text-xs font-bold px-2 py-0.5 border-2 border-primary uppercase ${
                      u.role === 'admin' ? 'bg-tertiary text-neutral' : 'bg-secondary text-primary'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm text-primary/70">{u.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
