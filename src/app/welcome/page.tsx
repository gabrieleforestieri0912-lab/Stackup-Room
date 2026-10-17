'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Repeat, LayoutGrid, TrendingUp, Compass, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Starfield from '../room/Starfield';

const FEATURES = [
  { icon: Repeat, title: 'Crea abitudini e momentum', sub: 'Registra gli standup, completa le task, fai crescere le tue streak' },
  { icon: LayoutGrid, title: 'Molte startup, un’app', sub: 'Gestisci tutto il tuo portafoglio in un unico posto' },
  { icon: TrendingUp, title: 'Classifiche verificate', sub: 'Traccia le metriche che contano, da Stripe a GitHub' },
  { icon: Compass, title: 'Coaching personalizzato', sub: 'Tarato sulle tue app, il tuo mercato, il tuo lancio' },
  { icon: Users, title: 'Il Club', sub: 'Entra in una community privata per founder seri' },
] as const;

export default function WelcomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Chi ha già completato l'onboarding va dritto in Room.
  useEffect(() => {
    if (!loading && user?.onboardingCompleted) router.replace('/room');
  }, [loading, user, router]);

  const start = () => {
    if (user) {
      router.push(user.onboardingCompleted ? '/room' : '/onboarding');
    } else {
      router.push('/register');
    }
  };

  return (
    <div className="room-scope relative min-h-screen overflow-y-auto bg-[#05070b] text-zinc-100">
      {/* Cielo notturno con stelle e comete */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ background: '#05070b' }} />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(900px 500px at 15% -5%, rgba(77,224,201,0.10), transparent 60%), radial-gradient(1000px 600px at 85% 110%, rgba(79,70,229,0.12), transparent 60%), radial-gradient(600px 400px at 80% 0%, rgba(255,138,61,0.06), transparent 60%)',
          }}
        />
        <Starfield />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(120% 90% at 50% 50%, transparent 60%, rgba(0,0,0,0.5) 100%)' }}
        />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-5 py-14">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/stackup.png"
            alt="Startup Club"
            width={64}
            height={64}
            priority
            className="mb-4 h-16 w-16 object-contain drop-shadow-[0_0_30px_rgba(77,224,201,0.3)]"
          />
          <h1 className="text-sm font-black uppercase tracking-[0.35em] text-room">Startup Club</h1>
          <p className="mt-6 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Spedisci ogni giorno.
            <br />
            Fai crescere la tua startup.
            <br />
            Non restare mai solo.
          </p>
        </div>

        {/* Feature list */}
        <ul className="divide-y divide-zinc-800/70 rounded-2xl border border-zinc-800/70 bg-white/[0.03] backdrop-blur-sm">
          {FEATURES.map(({ icon: Icon, title, sub }) => (
            <li key={title} className="flex items-start gap-4 px-5 py-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-room/10 text-room">
                <Icon size={18} />
              </span>
              <span>
                <span className="block text-sm font-bold text-white">{title}</span>
                <span className="block text-sm text-zinc-400">{sub}</span>
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={start}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-room px-6 py-3.5 text-sm font-black uppercase tracking-wider text-[#04120f] transition-all hover:bg-room-bright hover:shadow-[0_0_30px_rgba(77,224,201,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-room"
        >
          Inizia ora
          <ArrowRight size={18} />
        </button>
      </main>
    </div>
  );
}
