'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { getAccessToken } from '@/lib/auth-token';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Loader2, ArrowRight, BookOpen, Clock } from 'lucide-react';

type Course = { _id: string; title: string; slug: string; description?: string; duration?: number; imageUrl?: string; progress?: number };
const auth = async () => ({ Authorization: `Bearer ${await getAccessToken()}` });

function CorsiInner() {
  const { refreshUser } = useAuth();
  const sp = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (sp?.get('success') === 'true') {
        toast.success('Pagamento completato! Benvenuto nel corso.');
        await refreshUser();
      }
      const r = await fetch('/api/courses/enrolled', { headers: await auth() });
      const d = await r.json().catch(() => ({}));
      if (d.success) setCourses(d.data || []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="flex justify-center py-20" role="status" aria-label="Caricamento"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <div>
      <p className="text-orange-300 text-xs font-semibold uppercase tracking-[0.12em] mb-2">La mia area</p>
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">I tuoi <span className="text-orange-400">corsi</span></h1>
      <p className="text-sm text-zinc-400 mb-6">{courses.length > 0 ? `Hai ${courses.length} corsi nel tuo catalogo.` : 'Non hai ancora acquistato corsi.'}</p>

      {courses.length === 0 ? (
        <div className="border border-dashed border-zinc-700 rounded-2xl p-12 text-center">
          <BookOpen size={32} className="text-zinc-600 mx-auto mb-4" />
          <p className="font-bold text-white mb-2">Nessun corso acquistato</p>
          <Link href="/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold text-sm">
            Sfoglia il catalogo <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {courses.map((c) => (
            <li key={c._id}>
              <Link href={`/courses/${c.slug}`} className="block bg-black border border-zinc-800 rounded-2xl p-5 hover:border-orange-500/50 transition-all">
                <h2 className="font-bold text-white">{c.title}</h2>
                {c.description && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{c.description}</p>}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${c.progress || 0}%` }} />
                  </div>
                  <span className="text-[11px] font-bold text-zinc-400">{c.progress || 0}%</span>
                  {c.duration ? <span className="text-[11px] text-zinc-500 flex items-center gap-1"><Clock size={12} />{c.duration}h</span> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CorsiPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" /></div>}>
      <CorsiInner />
    </Suspense>
  );
}
