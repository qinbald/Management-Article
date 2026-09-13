'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateArticle() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/flask/add_articel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, author, description, category: 'Umum' }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/');
      } else {
        setError(data.messages || 'Gagal menyimpan artikel');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-neutral p-8 border-4 border-primary shadow-[8px_8px_0px_#2E2E2E] relative">
      <div className="absolute -top-3 -left-3 bg-secondary text-primary font-bold px-3 py-1 border-2 border-primary transform -rotate-6 uppercase">
        DRAFT BARU
      </div>
      
      <h1 className="text-3xl font-extrabold uppercase text-primary mb-8 mt-4 border-b-4 border-primary pb-2">
        TULIS ARTIKEL
      </h1>
      
      {error && (
        <div className="bg-tertiary text-neutral p-4 mb-6 font-bold uppercase border-2 border-primary">
          ERROR: {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold uppercase text-primary mb-2">JUDUL ARTIKEL</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full grunge-input px-4 py-3 text-primary font-bold"
            placeholder="MASUKKAN JUDUL..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold uppercase text-primary mb-2">NAMA PENULIS</label>
          <input
            type="text"
            required
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full grunge-input px-4 py-3 text-primary font-bold"
            placeholder="NAMA ANDA..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold uppercase text-primary mb-2">ISI ARTIKEL</label>
          <textarea
            required
            rows={10}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full grunge-input px-4 py-3 text-primary font-normal leading-relaxed"
            placeholder="TULISKAN IDE ATAU CERITA ANDA DI SINI..."
          />
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t-2 border-primary">
          <button
            type="button"
            onClick={() => router.back()}
            className="grunge-button-secondary px-6 py-3"
          >
            BATAL
          </button>
          <button
            type="submit"
            disabled={loading}
            className="grunge-button px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'MENYIMPAN...' : 'PUBLIKASIKAN'}
          </button>
        </div>
      </form>
    </div>
  );
}
