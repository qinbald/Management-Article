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

  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/flask/registrasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.messages);
        setUsername('');
        setEmail('');
        setPassword('');
      } else {
        setError(data.messages || 'Pendaftaran gagal');
      }
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  if (successMsg) {
    return (
      <div className="max-w-md mx-auto mt-10 glass-card p-8 text-center">
        <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Cek Kotak Masuk Anda</h1>
        <p className="text-foreground/70 mb-6">{successMsg}</p>
        <Link href="/login" className="glass-button px-6 py-2">
          Kembali ke Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 glass-card p-8 relative">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent/20 text-accent font-semibold px-4 py-1 rounded-full border border-accent/30 text-xs backdrop-blur-md">
        MEMBER BARU
      </div>
      <h1 className="text-3xl font-extrabold text-foreground mb-6 text-center mt-4">DAFTAR AKUN</h1>
      
      {error && (
        <div className="bg-tertiary/20 text-tertiary p-3 mb-4 font-semibold text-sm rounded-lg border border-tertiary/30 text-center">
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
          <label className="block text-xs font-semibold uppercase text-foreground/70 mb-1">EMAIL</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          {loading ? 'MEMPROSES...' : 'DAFTAR'}
        </button>
      </form>
      
      <p className="text-center text-sm font-medium text-foreground/70 mt-6">
        SUDAH PUNYA AKUN? <Link href="/login" className="text-primary hover:underline">MASUK DI SINI</Link>
      </p>
    </div>
  );
}
