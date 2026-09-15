'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmail() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Memverifikasi email Anda...');

  useEffect(() => {
    if (!token) return;

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/flask/api/auth/verify/${token}`);
        const data = await res.json();
        
        if (data.success) {
          setStatus('success');
          setMessage(data.messages);
        } else {
          setStatus('error');
          setMessage(data.messages);
        }
      } catch (err) {
        setStatus('error');
        setMessage('Terjadi kesalahan jaringan saat memverifikasi.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="max-w-md mx-auto mt-20 glass-card p-8 text-center">
      <h1 className="text-2xl font-bold text-foreground mb-4">Verifikasi Email</h1>
      
      {status === 'loading' && (
        <div className="animate-pulse text-foreground/70">{message}</div>
      )}
      
      {status === 'success' && (
        <div className="text-primary font-medium">
          <p className="mb-6">{message}</p>
          <Link href="/login" className="glass-button px-6 py-2">
            Lanjut ke Login
          </Link>
        </div>
      )}
      
      {status === 'error' && (
        <div className="text-tertiary font-medium">
          <p className="mb-6">{message}</p>
          <Link href="/login" className="glass-button px-6 py-2">
            Kembali ke Login
          </Link>
        </div>
      )}
    </div>
  );
}