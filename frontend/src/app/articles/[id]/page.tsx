'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ArticleDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeReaders, setActiveReaders] = useState(0);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const interactionCount = useRef(0);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/flask/api/articles/${id}`);
        const data = await res.json();
        if (data.success) {
          setArticle(data.data);
        } else {
          setError('Artikel tidak ditemukan');
        }
      } catch {
        setError('Terjadi kesalahan jaringan');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  // Tracking Session
  useEffect(() => {
    if (!article) return;

    let currentSessionId: string | null = null;
    let heartbeatInterval: NodeJS.Timeout;
    let readersInterval: NodeJS.Timeout;

    const startSession = async () => {
      try {
        const res = await fetch(`/api/flask/api/articles/${id}/reading/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referrer_source: document.referrer || 'Langsung' })
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
        if (data.success) setActiveReaders(data.active_readers);
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

  if (loading) return <div className="text-center py-20 font-bold uppercase tracking-widest text-primary">MEMUAT ARTIKEL...</div>;
  if (error || !article) return <div className="text-center py-20 font-bold text-tertiary uppercase">{error || 'ARTIKEL TIDAK DITEMUKAN'}</div>;

  return (
    <div 
      className="max-w-4xl mx-auto bg-neutral p-8 md:p-12 border-4 border-primary shadow-[12px_12px_0px_#2E2E2E] relative"
      onClick={handleInteraction}
      onScroll={handleInteraction}
    >
      <button onClick={() => router.back()} className="text-sm font-bold text-primary hover:text-tertiary mb-8 flex items-center gap-2 uppercase border-b-2 border-transparent hover:border-tertiary transition-all w-fit">
        &larr; KEMBALI KE ARSIP
      </button>
      
      <div className="flex flex-wrap justify-between items-end mb-6 gap-4 border-b-4 border-primary pb-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold bg-secondary text-primary px-3 py-1 border-2 border-primary uppercase w-fit transform -rotate-2">
            {article.category || 'UMUM'}
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary uppercase leading-none mt-2">
            {article.title}
          </h1>
        </div>
        
        <div className="flex flex-col items-end gap-1 text-xs font-bold text-primary uppercase text-right">
          <span className="flex items-center gap-2 bg-white border-2 border-primary px-2 py-1">
            <span className="w-2.5 h-2.5 bg-tertiary animate-pulse border border-primary"></span>
            {activeReaders} PEMBACA AKTIF
          </span>
          <span className="bg-white border-2 border-primary px-2 py-1 mt-1">
            {article.published_at?.slice(0, 10)}
          </span>
        </div>
      </div>

      <div className="text-sm font-bold text-primary mb-10 uppercase bg-white border-2 border-primary px-4 py-2 inline-block transform rotate-1">
        DITULIS OLEH: <span className="text-tertiary">{article.author}</span>
      </div>

      <div 
        ref={contentRef}
        className="prose prose-lg max-w-none text-primary leading-relaxed whitespace-pre-wrap font-normal"
      >
        {article.description}
      </div>
    </div>
  );
}
