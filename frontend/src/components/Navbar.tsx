'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useOnlineTracker } from '@/hooks/useOnlineTracker';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function Navbar() {
  // Panggil tracker heartbeat global
  useOnlineTracker();

  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string; warning_count?: number; last_warning_message?: string } | null>(null);
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/flask/api/notifications', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.unread_count);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/flask/api/me', {
          credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.data);
          fetchNotifications();
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };
    checkAuth();
  }, [pathname]);

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/flask/api/notifications/${id}/read`, { method: 'POST', credentials: 'include' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/flask/api/notifications/read-all', { method: 'POST', credentials: 'include' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotif(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    { name: 'Eksplorasi', href: '/' },
    { name: 'Mulai Menulis', href: '/articles/create' },
    { name: 'Sinkronisasi Wiki', href: '/articles/import' },
    { name: 'Pusat Wawasan', href: '/analytics' },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            {/* Hamburger Button (Mobile) */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -ml-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <Link href="/" className="flex items-center gap-2 group">
              <span className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-emerald-700 transition">
                W
              </span>
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-600 transition">
                WikiArtikel
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
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
                    className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200 transition"
                  >
                    ADMIN
                  </Link>
                )}
                
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button 
                    onClick={() => setShowNotif(!showNotif)}
                    className="relative p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-full transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Notifikasi */}
                  {showNotif && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-800">Notifikasi</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                            Tandai semua dibaca
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-slate-500">Belum ada notifikasi.</div>
                        ) : (
                          notifications.map(notif => (
                            <div 
                              key={notif.id} 
                              onClick={() => !notif.is_read && markAsRead(notif.id)}
                              className={`px-4 py-3 border-b border-slate-50 cursor-pointer transition hover:bg-slate-50 ${notif.is_read ? 'opacity-70' : 'bg-emerald-50/30'}`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${notif.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {notif.type.toUpperCase()}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">{notif.created_at}</span>
                              </div>
                              <h4 className={`text-sm ${notif.is_read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>{notif.title}</h4>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  href="/profile"
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold shadow-sm ring-2 ring-emerald-100 hover:ring-emerald-300 transition shrink-0"
                  title={user.username}
                >
                  {user.username[0].toUpperCase()}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-full hover:bg-slate-100 transition"
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-full hover:bg-slate-100 transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-full transition shadow-sm hover:shadow"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div ref={mobileMenuRef} className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 text-sm font-medium rounded-xl transition ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
