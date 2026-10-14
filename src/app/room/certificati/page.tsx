'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAccessToken } from '@/lib/auth-token';
import { Loader2, Trophy, ArrowRight } from 'lucide-react';

type Cert = { id: string; courseTitle: string; completedAt: string; finalScore: number };
const auth = async () => ({ Authorization: `Bearer ${await getAccessToken()}` });

export default function CertificatiPage() {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/certificates', { headers: await auth() });
      const d = await r.json().catch(() => ({}));
      if (d.success) setCerts(d.data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20" role="status" aria-label="Caricamento"><Loader2 className="animate-spin text-room" /></div>;

  return (
    <div>
      <p className="text-room-bright text-xs font-semibold uppercase tracking-[0.12em] mb-2">La mia area</p>
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">I tuoi <span className="text-room">certificati</span></h1>
      <p className="text-sm text-zinc-400 mb-6">{certs.length > 0 ? `${certs.length} certificati ottenuti.` : 'Completa un corso al 100% per ottenere il certificato.'}</p>

      {certs.length === 0 ? (
        <div className="border border-dashed border-zinc-700 rounded-2xl p-12 text-center">
          <Trophy size={32} className="text-zinc-600 mx-auto mb-4" />
          <p className="font-bold text-white mb-2">Nessun certificato</p>
          <Link href="/room/corsi" className="inline-flex items-center gap-2 px-6 py-3 bg-room text-[#0B0D12] rounded-xl font-bold text-sm">
            Vai ai tuoi corsi <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {certs.map((c) => (
            <li key={c.id}>
              <Link href={`/certificates/${c.id}`} className="flex items-center gap-3 bg-black border border-zinc-800 rounded-2xl p-5 hover:border-room/50 transition-all">
                <Trophy size={20} className="text-yellow-400 shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block font-bold text-sm text-white truncate">{c.courseTitle || 'Corso'}</span>
                  <span className="block text-[11px] text-zinc-500">{new Date(c.completedAt).toLocaleDateString('it-IT')} · {c.finalScore}%</span>
                </span>
                <ArrowRight size={16} className="text-zinc-600 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
