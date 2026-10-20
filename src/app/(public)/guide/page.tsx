/* eslint-disable react/no-unescaped-entities */
'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Badge from '@/components/ui/Badge';
import { GUIDE_CARDS } from '@/data/landingData';
import {
  DollarSign, Zap, ArrowRight, Cpu, Lightbulb, Code2, TrendingUp, Target, CheckCircle, BookOpen, Users,
} from 'lucide-react';

const Guide: React.FC = () => {
 const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://stackup.academy').replace(/\/$/, '');
 const guideItemList = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: GUIDE_CARDS.map((g, i) => ({
   '@type': 'ListItem',
   position: i + 1,
   name: g.title,
   url: `${siteUrl}${g.href}`,
  })),
 };
 const guideBreadcrumb = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
   { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
   { '@type': 'ListItem', position: 2, name: 'Guide', item: `${siteUrl}/guide` },
  ],
 };

 return (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5 }}
  className="max-w-7xl mx-auto px-6 pt-28 pb-16 flex flex-col gap-20"
 >
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideItemList).replace(/</g, '\\u003c') }} />
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideBreadcrumb).replace(/</g, '\\u003c') }} />
  {/* Hero */}
  <section className="relative">
  <div className="absolute inset-0 bg-orange-500/3 blur-3xl -z-10" />
  <motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.6 }}
  >
<Badge small>Guida Startup AI</Badge>
  <h1 className="max-w-5xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-7xl mb-6">
  Lancia la tua<br />
  <span className="text-orange-400">
  Startup AI da Solo.
  </span>
  </h1>
  <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-lg">
  Tutto quello che ti serve per passare dall'idea al primo utente pagante.
  Nessun fluff. Solo strategia pratica per sviluppatori solitari.
  </p>
  <div className="flex flex-wrap items-center gap-3 mt-6">
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">
  <Zap size={12} />
  Per sviluppatori
  </span>
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-zinc-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">
  <Cpu size={12} />
  AI-first
  </span>
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-zinc-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">
  <DollarSign size={12} />
  Zero budget
  </span>
  </div>
  </motion.div>
   </section>

  {/* Stats */}
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto w-full"
  >
    {[
      { value: '7', label: 'Guide complete' },
      { value: '5-15', label: 'Minuti per guida' },
      { value: '100%', label: 'Pratico e actionabile' },
      { value: 'Gratis', label: 'Accesso immediato' },
    ].map((stat, i) => (
      <div key={i} className="p-5 bg-black/40 border border-zinc-800 rounded-xl text-center">
        <div className="text-xl sm:text-2xl font-black text-white">{stat.value}</div>
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1">{stat.label}</div>
      </div>
    ))}
  </motion.div>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {GUIDE_CARDS.map((card) => {
  const Icon = card.icon;
  return (
  <Link
  key={card.id}
  href={card.href}
   className="p-5 bg-black border border-zinc-800 rounded-2xl hover:border-orange-300/30 transition-all duration-500 group flex flex-col no-underline"
  >
  <div className="flex items-center gap-3 mb-3">
   <div className="w-9 h-9 bg-orange-500/10 text-orange-300 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-orange-500/20 transition-all duration-500">
  <Icon size={18} />
  </div>
  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{card.tag}</span>
  </div>
  <h3 className="text-sm font-black text-white mb-1.5 group-hover:text-orange-300 transition-colors">{card.title}</h3>
  <p className="text-xs text-zinc-400 font-medium leading-relaxed line-clamp-2 flex-1">{card.desc}</p>
  <span className="mt-3 text-xs font-black text-orange-300 group-hover:text-orange-200 transition-colors inline-flex items-center gap-1">
  Leggi guida <ArrowRight size={12} />
  </span>
  </Link>
  );
  })}
  </div>

  {/* Features */}
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
  >
    <h2 className="text-xl sm:text-2xl font-jakarta font-black text-white tracking-tight text-center mb-8">
      Cosa troverai nelle <span className="text-orange-400">guide</span>
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
      {[
        { icon: Lightbulb, title: 'Ideazione rapida', desc: 'Impara a validare un\'idea in pochi giorni, non mesi. Strategie pratiche per founder solitari.' },
        { icon: Code2, title: 'Stack pratico', desc: 'Tecnologie moderne e leggere per shipvare veloce: Next.js, AI APIs, serverless.' },
        { icon: TrendingUp, title: 'Go-to-market', desc: 'Strategie di lancio low-budget che funzionano: Product Hunt, Reddit, build in public.' },
      ].map((feat, i) => {
        const Icon = feat.icon;
        return (
          <div key={i} className="p-6 bg-black/40 border border-zinc-800 rounded-xl text-center">
            <div className="w-10 h-10 bg-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Icon size={20} />
            </div>
            <h3 className="text-sm font-black text-white mb-2">{feat.title}</h3>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">{feat.desc}</p>
          </div>
        );
      })}
    </div>
  </motion.div>

  {/* CTA */}
  <section className="bg-[#111] border border-zinc-800 p-10 sm:p-14 text-center relative overflow-hidden rounded-2xl">
  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-500/5 blur-[120px] -z-10" />
  <div className="relative z-10 max-w-2xl mx-auto space-y-6">
 <motion.span
   initial={{ opacity: 0, y: 10 }}
   whileInView={{ opacity: 1, y: 0 }}
   viewport={{ once: true }}
 >
    <Badge small>Stackup Room</Badge>
 </motion.span>
  <motion.h2
  initial={{ opacity: 0, y: 10 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ delay: 0.1 }}
  className="text-2xl sm:text-3xl lg:text-4xl font-jakarta font-black text-white tracking-tight"
  >
  Guide più approfondite,<br className="sm:hidden" />
  <span className="text-orange-400">esempi e mentoring 1:1.</span>
  </motion.h2>
  <motion.p
  initial={{ opacity: 0, y: 10 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ delay: 0.2 }}
  className="text-zinc-400 font-medium leading-relaxed"
  >
   In Stackup Room trovi la versione completa di ogni guida con template, codice e supporto diretto.
  </motion.p>
  <motion.div
  initial={{ opacity: 0, y: 10 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ delay: 0.3 }}
  className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
  >
  <Link
 href="/register"
   className="px-8 py-3.5 bg-orange-500 text-white font-bold text-sm hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20 inline-flex items-center gap-2 rounded-xl"
  >
  Entra in Stackup Room <ArrowRight size={16} />
  </Link>
  <Link
 href="/courses"
   className="px-8 py-3.5 bg-black border border-zinc-800 text-zinc-200 font-bold text-sm hover:border-orange-400 hover:text-orange-400 transition-all rounded-xl"
  >
  Esplora i Corsi
  </Link>
  </motion.div>
  </div>
  </section>
 </motion.div>
 );
};

export default Guide;