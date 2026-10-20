import React from 'react';
import Link from 'next/link';
import { GUIDE_CARDS, FREE_RESOURCES, SHIP_RESOURCES } from '@/data/landingData';

const landingSections = [
  { name: 'Corsi', path: '/courses' },
  { name: 'Percorsi', path: '/paths' },
  { name: 'Guide', path: '/guide' },
  { name: 'Risorse', path: '/resources' },
  { name: 'Prezzi', path: '/#prezzi' },
];

const guideLinks = [
  { name: 'Tutte le Guide', path: '/guide' },
  ...GUIDE_CARDS.map(card => ({ name: card.title, path: card.href })),
];

const resourceLinks = [
  { name: 'Tutte le Risorse', path: '/resources' },
  ...FREE_RESOURCES.map(res => ({ name: res.title, path: res.href })),
  ...SHIP_RESOURCES.map(res => ({ name: res.title, path: res.href })),
];

const Footer = () => {
  return (
    <footer className="border-t border-zinc-800/60 bg-black">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-0">
          <nav aria-label="Link del footer" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-12">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-xl font-black text-white tracking-tight">
                Stack<span className="text-orange-500">Up</span>
              </span>
            </Link>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed">
              Percorsi pratici e project-based con mentorship 1:1 per aiutarti a crescere come developer e costruire progetti reali.
            </p>
          </div>

          <div>
            <h4 className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.25em] mb-5">Sezioni</h4>
            <ul className="space-y-3">
              {landingSections.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.path}
                    className="text-zinc-500 hover:text-orange-400 text-sm font-medium transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.25em] mb-5">Guide per Fondatori</h4>
            <ul className="space-y-3">
              {guideLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className="text-zinc-500 hover:text-orange-400 text-sm font-medium transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.25em] mb-5">Risorse</h4>
            <ul className="space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.path}
                    className="text-zinc-500 hover:text-orange-400 text-sm font-medium transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          </nav>

        <div className="mt-12 pt-8 pb-8 border-t border-zinc-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600 text-xs font-medium">
            &copy; {new Date().getFullYear()} Stackup Room. Sviluppato da{' '}
            <span className="text-zinc-400 font-semibold">Gabriele Forestieri</span>
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-zinc-600 hover:text-zinc-400 text-xs font-medium transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-zinc-600 hover:text-zinc-400 text-xs font-medium transition-colors">
              Termini
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
