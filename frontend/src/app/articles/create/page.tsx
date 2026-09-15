'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateArticle() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Umum');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/flask/add_articel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, author, description, category }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/');
      } else {
        setError(data.messages || 'Gagal menyimpan artikel');
      }
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto glass-card p-8 relative">
      <div className="absolute -top-3 -left-3 bg-secondary/20 text-secondary font-bold px-3 py-1 rounded-full border border-secondary/30 backdrop-blur-md text-xs">
        DRAFT BARU
      </div>
      
      <h1 className="text-3xl font-extrabold text-foreground mb-8 mt-4 border-b border-white/10 pb-4">
        TULIS ARTIKEL
      </h1>
      
      {error && (
        <div className="bg-tertiary/20 text-tertiary p-4 mb-6 font-semibold rounded-lg border border-tertiary/30">
          ERROR: {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase text-foreground/70 mb-2">JUDUL ARTIKEL</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full glass-input px-4 py-3 text-foreground"
            placeholder="Masukkan judul..."
          />
        </div>
        
        <div>
          <label className="block text-xs font-semibold uppercase text-foreground/70 mb-2">NAMA PENULIS</label>
          <input
            type="text"
            required
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full glass-input px-4 py-3 text-foreground"
            placeholder="Nama anda..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-foreground/70 mb-2">KATEGORI</label>
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

        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-xs font-semibold uppercase text-foreground/70">ISI ARTIKEL</label>
            <span className="text-xs font-medium text-slate-400">
              {description.length} karakter | {description.trim().split(/\s+/).filter(w => w.length > 0).length} kata
            </span>
          </div>
          <textarea
            ref={textareaRef}
            required
            rows={5}
            value={description}
            onChange={handleDescriptionChange}
            className="w-full glass-textarea px-4 py-4 text-foreground leading-relaxed min-h-[150px] overflow-hidden"
            placeholder="Tuliskan ide atau cerita anda di sini..."
          />
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={() => router.back()}
            className="glass-button-secondary px-6 py-3"
          >
            BATAL
          </button>
          <button
            type="submit"
            disabled={loading}
            className="glass-button px-8 py-3 disabled:opacity-50"
          >
            {loading ? 'MENYIMPAN...' : 'PUBLIKASIKAN'}
          </button>
        </div>
      </form>
    </div>
  );
}
