'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/flask/api/me', {
          credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.data);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };
    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/flask/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const navLinks = [
    { name: 'BERANDA', href: '/' },
    { name: 'TULIS ARTIKEL', href: '/articles/create' },
    { name: 'IMPOR WIKI', href: '/articles/import' },
    { name: 'ANALITIK', href: '/analytics' },
  ];

  return (
    <nav className="bg-neutral border-b-4 border-primary sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold tracking-tighter text-primary uppercase bg-secondary px-2 py-1 transform -rotate-2 border-2 border-primary">
              WIKI_ARTIKEL
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-bold uppercase transition-all ${
                      isActive
                        ? 'bg-primary text-neutral border-2 border-primary transform translate-y-1'
                        : 'text-primary hover:bg-secondary border-2 border-transparent hover:border-primary'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="text-sm font-bold text-neutral bg-tertiary hover:bg-primary px-3 py-1.5 border-2 border-primary uppercase transition"
                  >
                    ADMIN
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="text-sm font-bold text-primary uppercase border-2 border-primary px-3 py-1.5 bg-surface hover:bg-secondary transition"
                >
                  {user.username}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-bold bg-tertiary text-neutral px-3 py-1.5 border-2 border-primary hover:bg-primary transition uppercase"
                >
                  KELUAR
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-bold text-primary hover:bg-secondary px-3 py-1.5 border-2 border-transparent hover:border-primary uppercase"
                >
                  MASUK
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-bold bg-primary text-neutral px-3 py-1.5 border-2 border-primary hover:bg-tertiary transition uppercase"
                >
                  DAFTAR
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
