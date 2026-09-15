'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/flask/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/');
      } else {
        setError(data.messages || 'Login gagal');
      }
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 glass-card p-8 relative">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary/20 text-primary font-semibold px-4 py-1 rounded-full border border-primary/30 text-xs backdrop-blur-md">
        AKSES TERBATAS
      </div>
      <h1 className="text-3xl font-extrabold text-foreground mb-6 text-center mt-4">MASUK</h1>
      
      {error && (
        <div className="bg-tertiary/20 text-tertiary p-3 mb-4 font-semibold text-sm rounded-lg border border-tertiary/30 text-center backdrop-blur-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-foreground/70 mb-1">USERNAME</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full glass-input px-4 py-3 text-foreground"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-foreground/70 mb-1">PASSWORD</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full glass-input px-4 py-3 text-foreground"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full glass-button py-3 mt-2 disabled:opacity-50"
        >
          {loading ? 'MEMPROSES...' : 'MASUK'}
        </button>
      </form>
      
      <p className="text-center text-sm font-medium text-foreground/70 mt-6">
        BELUM PUNYA AKUN? <Link href="/register" className="text-primary hover:underline">DAFTAR DI SINI</Link>
      </p>
      <p className="text-center text-sm font-medium text-foreground/70 mt-2">
        LUPA KATA SANDI? <Link href="/forgot-password" className="text-primary hover:underline">RESET DI SINI</Link>
      </p>
    </div>
  );
}
