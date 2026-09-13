'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/flask/registrasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/login');
      } else {
        setError(data.messages || 'Pendaftaran gagal');
      }
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-neutral p-8 border-4 border-primary shadow-[8px_8px_0px_#2E2E2E] relative">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-surface text-neutral font-bold px-4 py-1 border-2 border-primary uppercase text-sm transform rotate-2">
        MEMBER BARU
      </div>
      <h1 className="text-3xl font-extrabold uppercase text-primary mb-6 text-center mt-4">DAFTAR AKUN</h1>
      
      {error && (
        <div className="bg-tertiary text-neutral p-3 mb-4 font-bold uppercase border-2 border-primary text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold uppercase text-primary mb-1">USERNAME</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full grunge-input px-4 py-3 font-bold text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-bold uppercase text-primary mb-1">EMAIL</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full grunge-input px-4 py-3 font-bold text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-bold uppercase text-primary mb-1">PASSWORD</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full grunge-input px-4 py-3 font-bold text-primary"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full grunge-button py-3 mt-2 disabled:opacity-50"
        >
          {loading ? 'MEMPROSES...' : 'DAFTAR'}
        </button>
      </form>
      
      <p className="text-center text-sm font-bold uppercase text-primary mt-6">
        SUDAH PUNYA AKUN? <Link href="/login" className="text-tertiary hover:underline">MASUK DI SINI</Link>
      </p>
    </div>
  );
}
