'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getAccessToken } from '@/lib/auth-token';
import ProfileTab from '../you/ProfileTab';
import { ExternalLink, Loader2, Mail, Lightbulb, Rocket, ChevronRight, Volume2, MessageCircle, Users, Bell, Wind } from 'lucide-react';

// Impostazioni Room in stile card: Account, Supporto, Suoni, Movimento, Profilo, Legale.
const card = 'bg-zinc-950/70 border border-zinc-800 rounded-2xl p-4 sm:p-5';
const kicker = 'text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500 mb-1';

type Snd = { events: boolean; chat: boolean; activity: boolean; session: boolean; volume: number };
const SND_KEY = 'room.snd';
const RM_KEY = 'room.reduceMotion';
const SND_DEFAULT: Snd = { events: true, chat: true, activity: true, session: true, volume: 33 };

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${on ? 'bg-room' : 'bg-zinc-800'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

function Row({ icon, title, desc, href, right }: {
  icon: React.ReactNode; title: string; desc?: string; href?: string; right?: React.ReactNode;
}) {
  const inner = (
    <>
      <span className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block font-bold text-[15px] text-white">{title}</span>
        {desc && <span className="block text-[13px] text-zinc-500">{desc}</span>}
      </span>
      {right ?? (href ? <ChevronRight size={16} className="text-zinc-600 shrink-0" /> : null)}
    </>
  );
  return href ? (
    <Link href={href} className="flex items-center gap-3.5 py-3 rounded-xl hover:bg-zinc-900/50 transition-colors -mx-2 px-2">{inner}</Link>
  ) : (
    <div className="flex items-center gap-3.5 py-3">{inner}</div>
  );
}

export default function RoomSettingsPage() {
  const { user, loading, logout } = useAuth();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [ready, setReady] = useState(false);
  const [snd, setSnd] = useState<Snd>(SND_DEFAULT);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (token) {
        const p = await fetch('/api/room/profile', { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json()).catch(() => ({}));
        if (p.profile) setProfile(p.profile);
      }
      try {
        const raw = localStorage.getItem(SND_KEY);
        if (raw) setSnd({ ...SND_DEFAULT, ...(JSON.parse(raw) as Partial<Snd>) });
        setReduceMotion(localStorage.getItem(RM_KEY) === '1');
      } catch { /* localStorage non disponibile */ }
      setReady(true);
    })();
  }, []);

  const saveSnd = (next: Snd) => {
    setSnd(next);
    try { localStorage.setItem(SND_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const saveReduceMotion = (v: boolean) => {
    setReduceMotion(v);
    document.documentElement.classList.toggle('reduced-motion', v);
    try { localStorage.setItem(RM_KEY, v ? '1' : '0'); } catch { /* ignore */ }
  };

  const previewSound = () => {
    try {
      const Ctx = window.AudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = Math.max(0.01, (snd.volume / 100) * 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
      setTimeout(() => ctx.close().catch(() => {}), 500);
    } catch { /* audio non supportato */ }
  };

  if (loading || !ready) {
    return <div className="flex justify-center py-20" role="status" aria-label="Caricamento"><Loader2 className="animate-spin text-room" /></div>;
  }
  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-zinc-400 mb-3">Accedi per gestire le impostazioni.</p>
        <Link href="/login" className="px-4 py-2.5 bg-room text-[#0B0D12] text-sm font-bold rounded-xl">Accedi</Link>
      </div>
    );
  }

  const name = String(profile?.name || user?.name || user?.email || 'Utente');
  const email = String(user?.email || '');
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-extrabold tracking-tight text-white flex-1">Impostazioni</h1>
      </div>

      {/* ACCOUNT */}
      <section className={card} aria-label="Account">
        <p className={kicker}>Account</p>
        <div className="flex items-center gap-3.5 py-2">
          <span className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-room shrink-0">🚀</span>
          <span className="flex-1 min-w-0">
            <span className="block font-bold text-[15px] text-white truncate">{name}</span>
            <span className="block text-[13px] text-zinc-500">Builder — gratis</span>
          </span>
        </div>
        {email && <Row icon={<Mail size={17} className="text-zinc-400" />} title={email} desc="Email dell'account" />}
        <div className="flex justify-center pt-2 pb-1">
          <button onClick={() => logout()} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-300 hover:text-white rounded-xl hover:bg-zinc-900/60 transition-colors">
            Esci
          </button>
        </div>
      </section>

      {/* SUPPORTO */}
      <section className={card} aria-label="Supporto">
        <p className={kicker}>Supporto</p>
        <Row icon={<Mail size={17} className="text-zinc-400" />} title="Scrivici"
          desc="Domande, abbonamenti, qualsiasi cosa — dritte alla casella del founder."
          href="mailto:gabriele.forestieri0912@gmail.com" />
        <Row icon={<Lightbulb size={17} className="text-yellow-400" />} title="Richiedi una funzione"
          desc="Dicci cosa costruire dopo — finisce subito nella roadmap."
          href="/room/feature" />
        <Row icon={<Rocket size={17} className="text-red-400" />} title="Segnala un bug"
          desc="Qualcosa si è rotto? Due minuti qui ci aiutano a sistemarlo in fretta."
          href="/room/report" />
      </section>

      {/* SUONI ROOM */}
      <section className={card} aria-label="Suoni Room">
        <p className={kicker}>Suoni Room</p>
        <div className="flex items-center gap-3.5 py-3">
          <span className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0"><Volume2 size={17} className="text-room" /></span>
          <span className="flex-1 min-w-0">
            <span className="block font-bold text-[15px] text-white">Suoni eventi</span>
            <span className="block text-[13px] text-zinc-500">Segnali discreti mentre l&apos;app è aperta</span>
          </span>
          <Toggle on={snd.events} label="Suoni eventi" onChange={(v) => saveSnd({ ...snd, events: v })} />
        </div>
        <div className="pl-1 pb-2">
          <p className="text-[13px] text-zinc-500 mb-1.5">Volume avvisi · {snd.volume}%</p>
          <div className="flex items-center gap-3">
            <Volume2 size={15} className="text-zinc-500 shrink-0" />
            <input type="range" min={0} max={100} value={snd.volume} aria-label="Volume avvisi"
              onChange={(e) => saveSnd({ ...snd, volume: Number(e.target.value) })}
              className="flex-1 h-1.5 accent-room bg-zinc-800 rounded-full cursor-pointer" />
          </div>
        </div>
        <Row icon={<MessageCircle size={17} className="text-room" />} title="Chat live"
          desc="Messaggi in arrivo da altri founder"
          right={<Toggle on={snd.chat} label="Chat live" onChange={(v) => saveSnd({ ...snd, chat: v })} />} />
        <Row icon={<Users size={17} className="text-room" />} title="Attività Room"
          desc="Messaggi della room e persone che entrano o escono"
          right={<Toggle on={snd.activity} label="Attività Room" onChange={(v) => saveSnd({ ...snd, activity: v })} />} />
        <Row icon={<Bell size={17} className="text-room" />} title="Avvisi sessione"
          desc="Timer, posti disponibili e cambi di connessione"
          right={<Toggle on={snd.session} label="Avvisi sessione" onChange={(v) => saveSnd({ ...snd, session: v })} />} />
        <button onClick={previewSound} className="text-[13px] font-bold text-room hover:text-room-bright transition-colors pt-1">
          Anteprima suoni
        </button>
      </section>

      {/* MOVIMENTO */}
      <section className={card} aria-label="Movimento">
        <p className={kicker}>Movimento</p>
        <Row icon={<Wind size={17} className="text-zinc-400" />} title="Riduci animazioni"
          desc="Transizioni più calme: liste, celebrazioni e ingressi compaiono senza animazione. Ricordato su questo dispositivo."
          right={<Toggle on={reduceMotion} label="Riduci animazioni" onChange={saveReduceMotion} />} />
      </section>

      {/* PROFILO: form, privacy, consenso IA, certificati, export, zona pericolosa */}
      <section className={card} aria-label="Profilo e dati">
        <ProfileTab />
      </section>

      {/* LEGALE */}
      <section className={card} aria-label="Legale">
        <p className={kicker}>Legale</p>
        <Row icon={<ExternalLink size={17} className="text-zinc-400" />} title="Termini di servizio" href="/terms" />
        <Row icon={<ExternalLink size={17} className="text-zinc-400" />} title="Privacy policy" href="/privacy" />
      </section>
    </div>
  );
}
