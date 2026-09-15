'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/flask/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      // Selalu tampilkan pesan sukses (anti-enumeration)
      setMessage(data.messages || 'Jika email terdaftar, instruksi reset telah dikirim.');
    } catch {
      setMessage('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="glass-card w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900">Lupa Kata Sandi</h1>
          <p className="text-sm text-slate-500">
            Masukkan email Anda dan kami akan mengirimkan tautan untuk mereset kata sandi.
          </p>
        </div>

        {message && (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm font-medium border border-emerald-100 text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Alamat Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
              placeholder="nama@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Mengirim...' : 'Kirim Tautan Reset'}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-100">
          <Link href="/login" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
            &larr; Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
