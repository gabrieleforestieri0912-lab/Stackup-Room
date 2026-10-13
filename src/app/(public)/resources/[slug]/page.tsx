'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Lock, Clock, ArrowRight, Tag, CheckCircle, Sparkles, BookOpen, Star, Target, Users,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { ALL_RESOURCES } from '@/data/landingData';
import { RESOURCES_CONTENT } from '@/data/resourcesContent';

const ResourceSlugPage: React.FC = () => {
  const params = useParams();
  const slug = params?.slug as string;

  const resource = ALL_RESOURCES.find((r) => r.href === `/resources/${slug}`);

  if (!resource) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-black text-white mb-4">Risorsa non trovata</h1>
        <p className="text-zinc-400 font-medium mb-8">La risorsa che cerchi non esiste o &egrave; stata rimossa.</p>
        <Link
          href="/resources"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all"
        >
          Torna alle risorse <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const Icon = resource.icon;
  const content = RESOURCES_CONTENT[slug];
  const steps = content
    ? content.sections.flatMap((s) => s.points.map((p) => `${s.title}: ${p}`))
    : [
        'Accedi alla risorsa completa',
        'Segui la guida passo passo',
        'Applica le conoscenze al tuo progetto',
        'Ripeti e migliora',
      ];

  const benefits = [
    { icon: Clock, text: `${resource.minutes} minuti di lettura` },
    { icon: BookOpen, text: 'Contenuto pratico e actionabile' },
    { icon: Star, text: 'Aggiornato al 2026' },
    { icon: Target, text: 'Applicabile subito al tuo progetto' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto px-6 py-12 sm:py-16"
    >
      {/* Breadcrumb */}
      <Link
        href="/resources"
        className="text-sm text-zinc-500 hover:text-zinc-300 font-medium inline-flex items-center gap-1 transition-colors mb-8"
      >
        ← Torna alle risorse
      </Link>

      {/* Hero */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center">
            <Icon size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 block">{resource.category}</span>
            {resource.free ? (
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Gratuita</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                <Lock size={10} /> Membri
              </span>
            )}
          </div>
        </div>

        <h1 className="max-w-5xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-7xl mb-4">
          {resource.title}
        </h1>
        <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-2xl">
          {resource.desc}
        </p>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 mt-6">
          <span className="inline-flex items-center gap-1.5 text-sm text-zinc-500 font-bold">
            <Clock size={14} />
            {resource.minutes} minuti di lettura
          </span>
          <div className="flex flex-wrap gap-1.5">
            {resource.tags.map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-900 text-zinc-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                <Tag size={10} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {benefits.map((benefit, i) => {
            const BenIcon = benefit.icon;
            return (
              <div key={i} className="flex items-center gap-3 p-4 bg-black/40 border border-zinc-800 rounded-xl">
                <div className="w-8 h-8 bg-orange-500/10 text-orange-400 rounded-lg flex items-center justify-center shrink-0">
                  <BenIcon size={16} />
                </div>
                <span className="text-sm text-zinc-300 font-medium">{benefit.text}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Contenuto esteso */}
      {content && (
        <>
          <section className="mb-10 space-y-4">
            {content.intro.map((p, i) => (
              <p key={i} className="text-base text-zinc-300 leading-relaxed">{p}</p>
            ))}
          </section>

          <section className="mb-12 space-y-4">
            {content.sections.map((s, i) => (
              <div key={i} className="bg-black/40 border border-zinc-800 p-6 rounded-2xl">
                <h2 className="font-bold text-white mb-2">{i + 1}. {s.title}</h2>
                <p className="text-sm text-zinc-300 leading-relaxed mb-3">{s.body}</p>
                <ul className="space-y-1.5">
                  {s.points.map((p, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <CheckCircle size={14} className="text-orange-400 shrink-0 mt-0.5" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section className="mb-16">
            <div className="bg-black/40 border border-zinc-800 p-6 sm:p-8 rounded-2xl">
              <h2 className="text-lg font-black text-white mb-5">Checklist</h2>
              <ul className="space-y-2.5">
                {content.checklist.map((c, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                    <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" /> {c}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}

      {/* Anteprima contenuto */}
      <section className="mb-16">
        <div className="bg-black/40 border border-zinc-800 p-6 sm:p-8 rounded-2xl">
          <h2 className="text-lg font-black text-white mb-6">Cosa imparerai</h2>
          <ul className="space-y-4">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <div className="w-6 h-6 bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 mt-0.5 rounded-lg">
                  <CheckCircle size={14} />
                </div>
                <span className="text-sm text-zinc-300 font-medium leading-relaxed">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      {resource.free ? (
        <section className="bg-linear-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 p-8 sm:p-10 text-center rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-500/8 blur-[100px] -z-10" />
          <div className="relative z-10 space-y-4">
            <div className="w-14 h-14 mx-auto bg-emerald-500/15 text-emerald-400 rounded-2xl flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <h2 className="text-xl sm:text-2xl font-jakarta font-black text-white tracking-tight">
              Risorsa gratuita.
            </h2>
            <p className="text-zinc-400 font-medium text-base leading-relaxed max-w-lg mx-auto">
              Scarica subito questa risorsa. Nessuna registrazione richiesta.
            </p>
            <Link
              href={resource.href}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-400 transition-all rounded-xl"
            >
              Scarica Gratis <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      ) : (
        <section className="bg-linear-to-br from-orange-500/10 to-transparent border border-orange-500/20 p-8 sm:p-10 text-center rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-orange-500/8 blur-[100px] -z-10" />
          <div className="relative z-10 space-y-5">
            <div className="w-14 h-14 mx-auto bg-orange-500/15 text-orange-400 rounded-2xl flex items-center justify-center">
              <Lock size={24} />
            </div>
            <h2 className="text-xl sm:text-2xl font-jakarta font-black text-white tracking-tight">
              Anteprima riservata ai membri.
            </h2>
            <p className="text-zinc-400 font-medium text-base leading-relaxed max-w-lg mx-auto">
              {resource.memberNote}. Entra in StackUp Room per accedere alla risorsa completa e a molto altro.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/register"
                className="px-8 py-3.5 bg-orange-500 text-white font-bold text-sm hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20 inline-flex items-center gap-2 rounded-xl"
              >
                Entra in StackUp Room <ArrowRight size={16} />
              </Link>
              <Link
                href="/resources"
                className="px-8 py-3.5 bg-black border border-zinc-800 text-zinc-200 font-bold text-sm hover:border-orange-400 hover:text-orange-400 transition-all rounded-xl"
              >
                Altre risorse
              </Link>
            </div>
          </div>
        </section>
      )}
    </motion.div>
  );
};

export default ResourceSlugPage;