'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import diff_match_patch from 'diff-match-patch';
import { ArticleDetailSkeleton } from '@/components/Skeleton';

interface Revision {
  id: number;
  editor: string;
  edited_content: string;
  created_at: string;
}

export default function ArticleDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [article, setArticle] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Revisi & Edit State
  const [showRevisions, setShowRevisions] = useState(false);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  const renderDiff = (oldText: string, newText: string) => {
    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(oldText || '', newText || '');
    dmp.diff_cleanupSemantic(diffs);

    return diffs.map((part: [number, string], index: number) => {
      const type = part[0]; // -1: delete, 1: insert, 0: equal
      const text = part[1];
      if (type === 1) {
        return <span key={index} className="bg-emerald-200 text-emerald-900 px-1 rounded">{text}</span>;
      }
      if (type === -1) {
        return <span key={index} className="bg-rose-200 text-rose-900 line-through px-1 rounded">{text}</span>;
      }
      return <span key={index}>{text}</span>;
    });
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeReaders, setActiveReaders] = useState(0);
  const [totalReaders, setTotalReaders] = useState(0);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const interactionCount = useRef(0);
  const sessionStartedRef = useRef<string | null>(null);

  useEffect(() => {
    // Ambil info artikel
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/flask/api/articles/${id}`);
        const data = await res.json();
        if (data.success) {
          setArticle(data.data);
          setEditContent(data.data.description || '');
        } else {
          setError('Artikel tidak ditemukan');
        }
      } catch {
        setError('Terjadi kesalahan jaringan');
      } finally {
        setLoading(false);
      }
    };

    // Ambil info login user
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/flask/api/me', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.data) {
          setCurrentUser(data.data);
        } else if (data.authenticated) {
          setCurrentUser(data.user);
        }
      } catch {}
    };

    fetchArticle();
    fetchUser();
  }, [id]);

  // Fetch revisions
  const fetchRevisions = async () => {
    setLoadingRevisions(true);
    try {
      const res = await fetch(`/api/flask/api/articles/${id}/revisions`);
      const data = await res.json();
      if (data.success) {
        setRevisions(data.data);
      }
    } catch {
      alert('Gagal memuat riwayat revisi');
    } finally {
      setLoadingRevisions(false);
    }
  };

  const handleOpenRevisions = () => {
    setShowRevisions(true);
    fetchRevisions();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/flask/api/articles/${id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ description: editContent })
      });
      const data = await res.json();
      if (data.success) {
        setArticle({ ...article, description: editContent });
        setIsEditing(false);
        alert('Artikel berhasil diperbarui!');
      } else {
        alert(data.messages || 'Gagal menyimpan perubahan');
      }
    } catch {
      alert('Terjadi kesalahan jaringan');
    } finally {
      setSavingEdit(false);
    }
  };

  // Tracking Session — tiap kunjungan = +1 permanen.
  // Guard per id tahan StrictMode double-mount (cleanup TIDAK reset ref).
  // Remount beneran (pindah artikel / balik lagi) = ref baru = hitung lagi.
  useEffect(() => {
    if (!article) return;
    if (sessionStartedRef.current === String(id)) return;
    sessionStartedRef.current = String(id);

    let currentSessionId: string | null = null;
    let heartbeatInterval: NodeJS.Timeout;
    let readersInterval: NodeJS.Timeout;

    const startSession = async () => {
      try {
        let visitorId = localStorage.getItem('visitor_id');
        if (!visitorId) {
          visitorId = crypto.randomUUID();
          localStorage.setItem('visitor_id', visitorId);
        }

        const res = await fetch(`/api/flask/api/articles/${id}/reading/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            referrer_source: document.referrer || 'Langsung',
            visitor_id: visitorId
          })
        });
        const data = await res.json();
        if (data.success) {
          currentSessionId = data.session_id;
          setSessionId(currentSessionId);
          if (currentSessionId) {
            startHeartbeat(currentSessionId);
          }
        }
      } catch (err) {
        console.error('Gagal memulai sesi tracking', err);
      }
    };

    const startHeartbeat = (sid: string) => {
      heartbeatInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          let scrollDepth = 0;
          if (contentRef.current) {
            const rect = contentRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const scrolled = windowHeight - rect.top;
            const total = rect.height;
            scrollDepth = Math.min(100, Math.max(0, Math.round((scrolled / total) * 100)));
          }

          fetch(`/api/flask/api/articles/${id}/reading/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sid,
              is_visible: true,
              max_scroll_depth: scrollDepth,
              interaction_count: interactionCount.current
            })
          }).catch(() => {});
        }
      }, 10000); // Tiap 10 detik
    };

    const fetchActiveReaders = async () => {
      try {
        const res = await fetch(`/api/flask/api/articles/${id}/active_readers`);
        const data = await res.json();
        if (data.success) {
          setActiveReaders(data.active_readers);
          setTotalReaders(data.total_readers);
        }
      } catch {}
    };

    startSession();
    fetchActiveReaders();
    readersInterval = setInterval(fetchActiveReaders, 15000);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(readersInterval);
      if (currentSessionId) {
        fetch(`/api/flask/api/articles/${id}/reading/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: currentSessionId })
        }).catch(() => {});
      }
    };
  }, [article, id]);

  const handleInteraction = () => {
    interactionCount.current += 1;
  };

  if (loading) return <ArticleDetailSkeleton />;
  if (error || !article) return <div className="text-center py-20 font-semibold text-tertiary">{error || 'ARTIKEL TIDAK DITEMUKAN'}</div>;

  return (
    <div 
      className="max-w-4xl mx-auto glass-card p-8 md:p-12 relative"
      onClick={handleInteraction}
      onScroll={handleInteraction}
    >
      <button onClick={() => router.back()} className="text-sm font-semibold text-foreground/70 hover:text-primary mb-8 flex items-center gap-2 transition-all w-fit">
        &larr; KEMBALI KE ARSIP
      </button>
      
      <div className="flex flex-wrap justify-between items-end mb-6 gap-4 border-b border-white/10 pb-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold bg-primary/15 text-primary px-3 py-1 rounded-full border border-primary/30 w-fit backdrop-blur-md">
              {article.category || 'UMUM'}
            </span>
            {article.is_locked && (
              <span className="text-xs font-semibold bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200 w-fit">
                DIKUNCI (HANYA BACA)
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-none mt-1">
            {article.title}
          </h1>
        </div>
        
        <div className="flex flex-col items-end gap-2 text-xs font-semibold text-foreground/70 text-right">
          <span className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
            <span className="w-2.5 h-2.5 bg-tertiary rounded-full animate-pulse"></span>
            {activeReaders} AKTIF · {totalReaders} KUNJUNGAN
          </span>
          <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md">
            {article.published_at?.slice(0, 10)}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-10">
        <div className="text-sm font-semibold text-foreground/70 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
          DITULIS OLEH <span className="text-primary">{article.author}</span>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleOpenRevisions}
            className="text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-full transition-colors"
          >
            RIWAYAT VERSI
          </button>
          
          {currentUser && (!article.is_locked || currentUser.role === 'admin') && (
            <button 
              onClick={() => setIsEditing(true)}
              className="text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-4 py-2 rounded-full transition-colors"
            >
              EDIT ARTIKEL
            </button>
          )}
        </div>
      </div>

      <div 
        ref={contentRef}
        className="prose prose-lg max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap"
      >
        {article.description}
      </div>

      {/* Modal Edit */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Edit Artikel</h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
              <textarea
                required
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 resize-none"
                placeholder="Tuliskan perubahan..."
              />
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-full font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">Batal</button>
                <button type="submit" disabled={savingEdit} className="px-6 py-2 rounded-full font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                  {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Riwayat Versi */}
      {showRevisions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-slate-900">Riwayat Versi</h3>
              <button onClick={() => setShowRevisions(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              {loadingRevisions ? (
                <div className="space-y-3 animate-pulse">{Array.from({length:3}).map((_,i)=><div key={i} className="h-20 bg-slate-100 rounded-xl" />)}</div>
              ) : revisions.length === 0 ? (
                <div className="text-center text-slate-500 py-10">Belum ada riwayat edit.</div>
              ) : (
                <div className="space-y-6">
                  {revisions.map((rev, idx) => {
                    const prevRev = idx < revisions.length - 1 ? revisions[idx + 1] : null;
                    const oldContent = prevRev ? prevRev.edited_content : article?.description || '';
                    return (
                      <div key={rev.id} className="relative pl-6 border-l-2 border-slate-200">
                        <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                        <div className="text-sm font-bold text-slate-900">{rev.editor}</div>
                        <div className="text-xs text-slate-500 mb-2">{rev.created_at}</div>
                        <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100 whitespace-pre-wrap break-words">
                          {renderDiff(oldContent, rev.edited_content)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
