'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImportWikipedia() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [lang, setLang] = useState('id');
  const [fullText, setFullText] = useState(false);
  
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
        body: JSON.stringify({ title: preview.title, lang, full_text: fullText, category: 'Umum' }),
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
    <div className="max-w-2xl mx-auto bg-neutral p-8 border-4 border-primary shadow-[8px_8px_0px_#2E2E2E] relative">
      <div className="absolute -top-3 -right-3 bg-surface text-neutral font-bold px-3 py-1 border-2 border-primary transform rotate-3 uppercase">
        WIKI SYNC
      </div>

      <h1 className="text-3xl font-extrabold uppercase text-primary mb-2 mt-2">IMPOR WIKIPEDIA</h1>
      <p className="text-primary/80 text-sm mb-8 font-bold uppercase border-b-4 border-primary pb-4">
        TARIK DATA ARTIKEL LANGSUNG DARI WIKIPEDIA KE SISTEM.
      </p>
      
      {error && (
        <div className="bg-tertiary text-neutral p-4 mb-6 font-bold uppercase border-2 border-primary">
          ERROR: {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold uppercase text-primary mb-2">TOPIK / JUDUL WIKIPEDIA</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 grunge-input px-4 py-3 text-primary font-bold"
              placeholder="CONTOH: KECERDASAN BUATAN"
            />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="grunge-input px-4 py-3 bg-white text-primary font-bold uppercase cursor-pointer"
            >
              <option value="id">ID</option>
              <option value="en">EN</option>
            </select>
            <button
              onClick={handlePreview}
              disabled={loadingPreview || !title}
              className="grunge-button px-6 py-3 disabled:opacity-50"
            >
              {loadingPreview ? 'MENCARI...' : 'CARI'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-3 border-2 border-primary">
          <input
            type="checkbox"
            id="fullText"
            checked={fullText}
            onChange={(e) => setFullText(e.target.checked)}
            className="w-5 h-5 accent-primary border-2 border-primary cursor-pointer"
          />
          <label htmlFor="fullText" className="text-sm font-bold uppercase text-primary cursor-pointer">
            SIMPAN TEKS LENGKAP (BUKAN HANYA RINGKASAN)
          </label>
        </div>

        {preview && (
          <div className="mt-8 p-6 bg-white border-4 border-primary relative transform rotate-[0.5deg]">
            <div className="absolute -top-3 left-4 bg-secondary text-primary font-bold px-2 py-1 text-xs border-2 border-primary uppercase">
              PREVIEW
            </div>
            <h3 className="font-extrabold text-xl text-primary mb-3 uppercase mt-2">{preview.title}</h3>
            <p className="text-sm text-primary/90 mb-6 line-clamp-5 leading-relaxed font-normal">
              {preview.summary}
            </p>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t-2 border-primary pt-4">
              <a
                href={preview.full_url}
                target="_blank"
                rel="noreferrer"
                className="text-accent font-bold text-sm hover:underline uppercase"
              >
                LIHAT DI WIKIPEDIA &rarr;
              </a>
              <button
                onClick={handleImport}
                disabled={loadingImport}
                className="grunge-button px-6 py-3 w-full sm:w-auto disabled:opacity-50"
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
