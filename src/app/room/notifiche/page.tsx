'use client';

import { useEffect, useState } from 'react';
import { roomAuthHeaders } from '@/lib/auth-token';
import { Loader2 } from 'lucide-react';

type N = { id: string; kind: string; text: string; ref_type: string | null; ref_id: string | null; read: boolean; created_at: string };

export default function NotifichePage() {
  const [items, setItems] = useState<N[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const r = await fetch('/api/room/notifications', { headers: await roomAuthHeaders() });
    if (r.ok) setItems(await r.json().then((d) => d.notifications));
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const readAll = async () => {
    await fetch('/api/room/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await roomAuthHeaders()) }, body: JSON.stringify({ all: true }) });
    load();
  };

  if (loading) return <div className="flex justify-center py-20" role="status"><Loader2 className="animate-spin text-room" /></div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight flex-1">Notifiche.</h1>
        <button onClick={readAll} className="px-3 py-1.5 text-xs font-bold bg-zinc-900 border border-zinc-700 rounded-lg">Segna tutte lette</button>
      </div>
      {items.length === 0 ? <p className="text-sm text-zinc-500 text-center py-10">Nessuna notifica.</p> : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id}>
              <button
                onClick={async () => {
                  await fetch('/api/room/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await roomAuthHeaders()) }, body: JSON.stringify({ id: n.id }) });
                  load();
                }}
                className={`w-full text-left border rounded-2xl p-4 ${n.read ? 'border-zinc-800 text-zinc-400' : 'border-room/50 bg-room/5 text-white'}`}>
                <p className="text-sm font-semibold">{n.text}</p>
                <p className="text-[11px] text-zinc-600 mt-1">{new Date(n.created_at).toLocaleString('it-IT')}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
