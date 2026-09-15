'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImportWikipedia() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [lang, setLang] = useState('id');
  const [fullText, setFullText] = useState(false);
  const [category, setCategory] = useState('Umum');
  
  const [preview, setPreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [error, setError] = useState('');

  const handlePreview = async () => {
    if (!title) return;
    setLoadingPreview(true);
    setError('');
    setPreview(null);

    try {
      const res = await fetch(`/api/flask/api/wiki/preview?title=${encodeURIComponent(title)}&lang=${lang}`);
      const data = await res.json();
      if (data.success) {
        setPreview(data.data);
      } else {
        setError(data.message || 'Artikel tidak ditemukan');
      }
    } catch (err) {
      setError('Gagal mengambil preview dari server');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setLoadingImport(true);
    setError('');

    try {
      const res = await fetch('/api/flask/api/wiki/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: preview.title, lang, full_text: fullText, category }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/');
      } else {
        setError(data.message || 'Gagal mengimpor artikel');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat impor');
    } finally {
      setLoadingImport(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto glass-card p-8 relative">
      <div className="absolute -top-3 right-6 bg-accent/20 text-accent font-semibold px-4 py-1 rounded-full border border-accent/30 text-xs backdrop-blur-md">
        WIKI SYNC
      </div>

      <h1 className="text-3xl font-extrabold text-foreground mb-2 mt-2">IMPOR WIKIPEDIA</h1>
      <p className="text-foreground/70 text-sm mb-8 font-medium border-b border-white/10 pb-4">
        Tarik data artikel langsung dari Wikipedia ke sistem.
      </p>
      
      {error && (
        <div className="bg-tertiary/20 text-tertiary p-4 mb-6 font-semibold text-sm rounded-lg border border-tertiary/30">
          ERROR: {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase text-foreground/70 mb-2">TOPIK / JUDUL WIKIPEDIA</label>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full sm:w-auto grow min-w-0 glass-input px-4 py-3 text-foreground"
              placeholder="Contoh: Kecerdasan Buatan"
            />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="glass-input px-4 py-3 text-foreground cursor-pointer shrink-0 w-full sm:w-28 text-center"
            >
              <option value="id">ID</option>
              <option value="en">EN</option>
            </select>
            <button
              onClick={handlePreview}
              disabled={loadingPreview || !title}
              className="glass-button px-6 py-3 disabled:opacity-50 shrink-0 w-full sm:w-auto"
            >
              {loadingPreview ? 'MENCARI...' : 'CARI'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/5 p-4 rounded-lg border border-white/10">
          <input
            type="checkbox"
            id="fullText"
            checked={fullText}
            onChange={(e) => setFullText(e.target.checked)}
            className="w-5 h-5 accent-primary cursor-pointer rounded"
          />
          <label htmlFor="fullText" className="text-sm font-semibold text-foreground/80 cursor-pointer">
            Simpan teks lengkap (bukan hanya ringkasan)
          </label>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-foreground/70 mb-2">KATEGORI PENYIMPANAN</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full glass-input px-4 py-3 text-foreground cursor-pointer"
          >
            {[
              'Umum',
              'Sains & Teknologi',
              'Sejarah & Geografi',
              'Sosial & Budaya',
              'Kesehatan & Gaya Hidup',
              'Ekonomi & Bisnis',
              'Biografi'
            ].map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {preview && (
          <div className="mt-8 p-6 glass-card relative">
            <div className="absolute -top-3 left-6 bg-primary/20 text-primary font-semibold px-3 py-1 rounded-full border border-primary/30 text-xs backdrop-blur-md">
              PREVIEW
            </div>
            <h3 className="font-extrabold text-xl text-foreground mb-3 mt-2">{preview.title}</h3>
            <p className="text-sm text-foreground/80 mb-6 line-clamp-5 leading-relaxed">
              {preview.summary}
            </p>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-white/10 pt-4">
              <a
                href={preview.full_url}
                target="_blank"
                rel="noreferrer"
                className="text-accent font-semibold text-sm hover:underline"
              >
                Lihat di Wikipedia &rarr;
              </a>
              <button
                onClick={handleImport}
                disabled={loadingImport}
                className="glass-button px-6 py-3 w-full sm:w-auto disabled:opacity-50"
              >
                {loadingImport ? 'MENGIMPOR...' : 'IMPOR ARTIKEL INI'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
