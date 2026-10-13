/* eslint-disable react/no-unescaped-entities */
'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CheckCircle, ArrowRight, Lightbulb, Code2, DollarSign, TrendingUp, Rocket, Target, Wrench, Brain, Clock, BookOpen, Star, AlertTriangle, ListChecks, Zap,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { GUIDES_CONTENT } from '@/data/guidesContent';

const GUIDE_META: Record<string, { icon: React.ElementType; tag: string }> = {
  'validare-idea': { icon: Lightbulb, tag: 'Ideazione' },
  'scegliere-stack': { icon: Code2, tag: 'Tecnologia' },
  'pricing-gtm': { icon: DollarSign, tag: 'Business' },
  'go-to-market': { icon: TrendingUp, tag: 'Marketing' },
  'ai-first-strategy': { icon: Target, tag: 'Prodotto' },
  'tooling-automation': { icon: Wrench, tag: 'Tooling' },
  'debugging-mentale': { icon: Brain, tag: 'Mindset' },
};

const GuideSlugPage: React.FC = () => {
  const params = useParams();
  const slug = params?.slug as string;

  const guide = GUIDES_CONTENT[slug];
  const meta = GUIDE_META[slug];

  if (!guide) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-black text-white mb-4">Guida non trovata</h1>
        <p className="text-zinc-400 font-medium mb-8">La guida che cerchi non esiste o &egrave; stata rimossa.</p>
        <Link
          href="/guide"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all"
        >
          Torna alle guide <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const Icon = meta?.icon || Rocket;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto px-6 py-12 sm:py-16"
    >
      <Link
        href="/guide"
        className="text-sm text-zinc-500 hover:text-zinc-300 font-medium mb-6 inline-flex items-center gap-1 transition-colors"
      >
        ← Torna alle guide
      </Link>

      <section className="mb-10">
        <div className="flex items-center gap-3 mt-6 mb-4">
          <div className="w-10 h-10 bg-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center">
            <Icon size={20} />
          </div>
          <Badge small>{meta?.tag || 'Guida'}</Badge>
        </div>
        <h1 className="max-w-5xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl mb-4">
          {guide.title}
        </h1>
        <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-2xl">
          {guide.desc}
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-zinc-500 font-bold">
          <span className="flex items-center gap-1.5">
            <BookOpen size={16} />
            {guide.steps.length} step operativi
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={16} />
            10-15 min di lettura
          </span>
        </div>
      </section>

      <section className="mb-10 space-y-4">
        {guide.intro.map((p, i) => (
          <p key={i} className="text-base text-zinc-300 leading-relaxed">{p}</p>
        ))}
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-black text-white mb-6">Cosa fare, passo passo</h2>
        <ol className="space-y-4">
          {guide.steps.map((step, i) => (
            <li key={i} className="bg-black/40 border border-zinc-800 p-6 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 rounded-lg text-base font-black">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-zinc-300 leading-relaxed mb-3">{step.detail}</p>
                  <p className="text-sm leading-relaxed flex items-start gap-2 bg-orange-500/5 border border-orange-500/20 rounded-xl px-3 py-2">
                    <Zap size={14} className="text-orange-400 shrink-0 mt-0.5" />
                    <span><strong className="text-orange-300">Azione: </strong><span className="text-zinc-200">{step.action}</span></span>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-12">
        <div className="bg-red-500/5 border border-red-500/20 p-6 sm:p-8 rounded-2xl">
          <h2 className="text-lg font-black text-white mb-5 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-400" /> Errori che vedo sempre
          </h2>
          <ul className="space-y-2.5">
            {guide.mistakes.map((m, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                <span className="text-red-400 font-black shrink-0">×</span> {m}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mb-16">
        <div className="bg-black/40 border border-zinc-800 p-6 sm:p-8 rounded-2xl">
          <h2 className="text-lg font-black text-white mb-5 flex items-center gap-2">
            <ListChecks size={18} className="text-emerald-400" /> Checklist: hai finito quando…
          </h2>
          <ul className="space-y-2.5">
            {guide.checklist.map((c, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" /> {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mb-8 flex items-center gap-3 text-sm text-zinc-500 font-bold">
        <Star size={14} className="text-orange-400" />
        Guida completa e gratuita. Nella Room trovi planner, coach e community per metterla in pratica.
      </section>

      <section className="bg-linear-to-br from-orange-500/10 to-transparent border border-orange-500/20 p-8 sm:p-10 text-center rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-orange-500/8 blur-[100px] -z-10" />
        <div className="relative z-10 space-y-5">
          <h2 className="text-xl sm:text-2xl font-jakarta font-black text-white tracking-tight">
            Mettila in pratica nella Room.
          </h2>
          <p className="text-zinc-400 font-medium text-base leading-relaxed max-w-lg mx-auto">
            Planner giornaliero, streak di shipping, coach AI e altri founder che stanno facendo lo stesso percorso.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="px-8 py-3.5 bg-orange-500 text-white font-bold text-sm hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20 inline-flex items-center gap-2 rounded-xl"
            >
              Entra in StackUp Room <ArrowRight size={16} />
            </Link>
            <Link
              href="/guide"
              className="px-8 py-3.5 bg-black border border-zinc-800 text-zinc-200 font-bold text-sm hover:border-orange-400 hover:text-orange-400 transition-all rounded-xl"
            >
              Altre guide
            </Link>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default GuideSlugPage;
