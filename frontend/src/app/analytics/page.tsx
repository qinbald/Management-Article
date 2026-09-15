'use client';

import { useEffect, useState } from 'react';

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/flask/api/analytics');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError('Gagal memuat data analitik');
        }
      } catch {
        setError('Terjadi kesalahan jaringan');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="text-center py-20 font-semibold tracking-widest text-foreground/70 animate-pulse">MEMUAT ANALITIK...</div>;
  if (error) return <div className="text-center py-20 font-semibold text-tertiary">{error}</div>;
  if (!data || !data.summary) return <div className="glass-card text-center py-20 font-semibold text-foreground/70 p-8">BELUM ADA DATA ANALITIK.</div>;

  const { summary, category_stats, top_articles, referrer_stats } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="glass-card p-6">
        <h1 className="text-3xl font-extrabold text-foreground">DASBOR ANALITIK</h1>
        <p className="text-xs font-semibold uppercase text-foreground/50 mt-1">DATA REAL — TANPA DUMMY — DARI READING SESSION</p>
      </div>
      
      {/* Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="ONLINE SAAT INI" value={summary.current_active_users} />
        <StatCard title="PENGUNJUNG UNIK" value={summary.total_unique_visitors} />
        <StatCard title="TOTAL KUNJUNGAN" value={summary.total_visits} />
        <StatCard title="RATA WAKTU BACA" value={`${summary.avg_read_time_min} MNT`} />
        <StatCard title="BOUNCE RATE" value={`${summary.bounce_rate_pct}%`} />
        <StatCard title="RATA SCROLL" value={`${summary.avg_scroll_depth}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Artikel */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-extrabold text-foreground mb-4 border-b border-white/10 pb-2">ARTIKEL TERPOPULER</h2>
          <div className="space-y-4">
            {top_articles.map((art: any, i: number) => (
              <div key={i} className="flex justify-between items-center border-b border-white/10 pb-3 last:border-0 last:pb-0">
                <div className="pr-4">
                  <h3 className="font-bold text-foreground line-clamp-1">{art.title}</h3>
                  <p className="text-xs font-medium uppercase text-foreground/50">{art.category}</p>
                </div>
                <div className="text-right shrink-0 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg backdrop-blur-md">
                  <div className="font-extrabold text-primary">{art.views} VIEW</div>
                  <div className="text-xs font-medium text-foreground/50">{art.avg_active_time}S AVG</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kategori */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-extrabold text-foreground mb-4 border-b border-white/10 pb-2">PERFORMA KATEGORI</h2>
          <div className="space-y-4">
            {category_stats.map((cat: any, i: number) => (
              <div key={i} className="flex justify-between items-center border-b border-white/10 pb-3 last:border-0 last:pb-0">
                <div>
                  <h3 className="font-bold text-foreground">{cat.category}</h3>
                  <p className="text-xs font-medium uppercase text-foreground/50">{cat.total_articles} ARTIKEL</p>
                </div>
                <div className="text-right bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg backdrop-blur-md">
                  <div className="font-extrabold text-primary">{cat.total_visits} VIEW</div>
                  <div className="text-xs font-medium text-foreground/50">{cat.bounce_rate}% BOUNCE</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string, value: string | number }) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-xs font-semibold uppercase text-foreground/50 mb-1">{title}</h3>
      <div className="text-3xl font-extrabold text-foreground">{value}</div>
    </div>
  );
}
