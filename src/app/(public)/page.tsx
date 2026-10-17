 
/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Users,
  Target,
  Code,
  Sparkles,
  Check,
  Star,
  Lightbulb,
  Rocket,
  BookOpen,
  Zap,
  Lock,
  Calendar,
  Megaphone,
  Wrench,
  TrendingUp,
  DollarSign,
  Code2,
  RefreshCw,
  Terminal,
  Search,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { FAQ, SHIP_RESOURCES, GUIDE_CARDS, PATHS, COURSES_PREVIEW } from "@/data/landingData";

function highlightText(text: string) {
  const greenWords = ['certificato', 'LinkedIn', 'curriculum', 'community privata', 'progetti guidati'];
  const redWords: string[] = [];

  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const greenPattern = greenWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const redPattern = redWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const pattern = `(${greenPattern}|${redPattern})`;
  const regex = new RegExp(pattern, 'gi');

  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (!part) return null;
    const lower = part.toLowerCase();
    if (greenWords.some(w => lower === w.toLowerCase())) {
      return <span key={i} className="text-emerald-400 font-semibold">{part}</span>;
    }
    if (redWords.some(w => lower === w.toLowerCase())) {
      return <span key={i} className="text-red-400 font-semibold">{part}</span>;
    }
    return part;
  });
}

function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

function coursesItemListJsonLd() {
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://stackup.academy').replace(/\/$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: COURSES_PREVIEW.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.title,
      url: `${siteUrl}/courses/${c.id}`,
    })),
  };
}

const Home: React.FC = () => {
  const { user } = useAuth();
  // Utenti loggati: le CTA pricing portano al catalogo corsi (acquisto),
  // non alla registrazione.
  const pricingHref = user ? "/courses" : "/register";
  const pricingLabel = user ? "Scegli un corso" : "Inizia Ora";
  return (
    <div className="bg-[#0a0a0a] min-h-screen overflow-x-hidden">
      {/* JSON-LD: FAQ (AEO/GEO) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()).replace(/</g, '\\u003c') }}
      />
      {/* JSON-LD: catalogo corsi in evidenza */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(coursesItemListJsonLd()).replace(/</g, '\\u003c') }}
      />
      {/* ===== HERO ===== */}
      <section className="relative pt-24 pb-8 lg:pt-32 lg:pb-16 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-orange-500/5 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange-500/8 blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-orange-400/4 blur-[150px]" />
        </div>
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col items-center text-center gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-5 inline-flex items-center rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-orange-200 md:text-sm"
            >
              <Sparkles size={12} className="text-orange-400 mr-1.5" />
              Per i fondatori individuali che utilizzano l'IA per creare app redditizie
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="max-w-5xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-7xl"
            >
              Smettila di creare app<br />
              che non generano alcun profitto.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-lg sm:text-xl text-zinc-400 max-w-xl leading-relaxed font-medium"
            >
              Mentorship 1:1, progetti reali e una community che ti spinge
              oltre. Non è un corso. È il metodo che trasforma principianti in
              developer.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Link
                href="/register"
                className="px-8 py-3.5 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
              >
                Unisciti alla Community <ArrowRight size={16} />
              </Link>
              <Link
                href="/courses"
                className="px-8 py-3.5 bg-black border border-zinc-800 rounded-xl text-zinc-200 font-bold text-sm hover:border-orange-400 hover:text-orange-400 transition-all flex items-center justify-center gap-2"
              >
                Esplora i Corsi <BookOpen size={16} />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-4 text-center"
            >
              {[
                { n: "1:1", l: "Mentorship" },
                { n: "100%", l: "Hands-on" },
                { n: "24/7", l: "Community" },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-xl sm:text-2xl font-black text-white">
                    {s.n}
                  </div>
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">
                    {s.l}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Guide rapide rettangolari */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto mt-12"
            >
              {[
                {
                  title: "Validare un'idea",
                  desc: "Trova un problema reale e verifica la domanda prima di scrivere codice.",
                  href: "/guide/validare-idea",
                },
                {
                  title: "Scegliere lo stack",
                  desc: "Next.js, Supabase, Vercel: gli strumenti per shipvare veloce.",
                  href: "/guide/scegliere-stack",
                },
                {
                  title: "Pricing & go-to-market",
                  desc: "Modelli di revenue e strategie di lancio per founder solitari.",
                  href: "/guide/pricing-gtm",
                },
              ].map((g, i) => (
                <Link
                  key={i}
                  href={g.href}
                  className="flex items-center gap-4 p-5 bg-[#111] border border-zinc-800 rounded-xl hover:border-orange-300/30 hover:bg-black/80 transition-all duration-500 group"
                >
                  <Lock
                    size={24}
                    className="text-orange-400/40 group-hover:text-orange-300 transition-colors shrink-0"
                  />
                  <div className="min-w-0 text-left">
                    <h4 className="text-sm font-black text-white group-hover:text-orange-300 transition-colors truncate">
                      {g.title}
                    </h4>
                    <p className="text-xs text-zinc-400 font-medium leading-relaxed mt-0.5">
                      {g.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== RESOURCE ROADMAP ===== */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/3 blur-[150px] -z-10" />
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-14"
          >
            <Badge small textOnly>Resource Roadmap</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-jakarta font-black text-white tracking-tight">
              Strumenti e <span className="text-orange-400">Risorse.</span>
            </h2>
            <p className="text-zinc-400 font-medium text-base sm:text-lg mt-4">
              Link diretti a strumenti e documentazione che userai ogni giorno.
            </p>
            <Link
              href="/resources"
              className="inline-flex items-center gap-1.5 mt-5 text-sm font-black text-orange-400 hover:text-orange-300 transition-colors"
            >
              Vedi tutte le risorse →
            </Link>
          </motion.div>

          <div className="flex flex-col gap-0 border border-zinc-800 overflow-hidden rounded-2xl max-w-5xl mx-auto">
            {SHIP_RESOURCES.map((res, i) => {
              const Icon = res.icon;
              return (
                <Link
                  key={i}
                  href={res.href}
                  className={`group flex flex-wrap items-start gap-5 px-6 py-7 bg-zinc-950 hover:bg-zinc-900/60 transition-colors duration-200 no-underline ${
                    i < SHIP_RESOURCES.length - 1
                      ? "border-b border-zinc-800"
                      : ""
                  }`}
                >
                  <span className="w-9 h-9 border border-zinc-700 text-zinc-400 text-[11px] font-black flex items-center justify-center shrink-0 mt-1 rounded-xl">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="w-10 h-10 bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0 mt-0.5 rounded-xl">
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-orange-400 font-mono text-[9px] font-black uppercase tracking-[0.2em] mb-1">
                      {res.category}
                    </p>
                    <h3 className="text-base font-black text-white font-mono leading-snug mb-2">
                      {res.title}
                    </h3>
                    <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                      {res.desc}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0 w-full sm:w-auto sm:ml-4 mt-1">
                    <p className="text-xs text-zinc-500 text-right max-w-[200px] leading-snug flex items-start gap-1.5">
                      <Lock size={11} className="shrink-0 mt-0.5" />
                      {res.memberNote}
                    </p>
                    <span className="text-sm font-black text-white group-hover:text-orange-300 transition-colors whitespace-nowrap">
                      Visualizza l'anteprima →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== PLAYBOOKS + AI SKILLS ===== */}
      <section
        id="metodo"
        className="pt-10 lg:pt-16 pb-20 lg:pb-28 relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/3 blur-[150px] -z-10" />
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mt-20 mb-16 max-w-5xl mx-auto"
          >
            <Badge>Playbook + competenze di intelligenza artificiale</Badge>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {[
              {
                icon: Terminal,
                category: 'AGENT SKILL BUNDLE',
                title: 'Trasforma il tuo SaaS in Agent Interfaces',
                desc: 'Converti il tuo SaaS in una CLI, server MCP o API surface per agenti AI.',
                tags: ['CLI skill', 'MCP skill', 'API skill'],
                href: '/ai-skills/saas-agent-interfaces',
                memberNote: 'Skill installabile inclusa per i membri',
              },
              {
                icon: Search,
                category: 'CUSTOMER DISCOVERY',
                title: 'Reddit Research Skill',
                desc: 'Trova thread Reddit rilevanti e prepara bozze di risposta che i founder possono revisionare.',
                tags: ['Agent skill', 'Search workflow', 'Reply drafts'],
                href: '/ai-skills/reddit-research',
                memberNote: 'Skill installabile inclusa per i membri',
              },
              {
                icon: Sparkles,
                category: 'CREATIVE MARKETING',
                title: 'Higgsfield UGC Generator Skill',
                desc: 'Crea bozze di prompt UGC realistici per demo, clip e annunci organici.',
                tags: ['Agent skill', 'Prompt generator', 'UGC patterns'],
                href: '/ai-skills/ugc-generator',
                memberNote: 'Skill installabile inclusa per i membri',
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ scale: 1.02 }}
                  className="p-5 bg-[#111] border border-zinc-800 rounded-2xl hover:border-orange-300/30 transition-all duration-500 flex flex-col"
                >
                  <span className="inline-block px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-400 text-[9px] font-black uppercase tracking-widest mb-2 self-start">
                    {card.category}
                  </span>
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center shrink-0">
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-white">{card.title}</h3>
                      <p className="text-xs text-zinc-400 font-medium leading-relaxed">{card.desc}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {card.tags.map((t, j) => (
                      <span key={j} className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-900 text-zinc-400 text-[8px] font-bold uppercase tracking-wider rounded-md">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center flex-col justify-between mt-auto pt-3 border-t border-zinc-800">
                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-bold">
                      <Lock size={24} className="translate-y-px" />
                      {card.memberNote}
                    </span>
                    <Link
                      href={card.href}
                      className="text-xs font-black text-white hover:text-orange-400 transition-colors inline-flex items-center gap-1"
                    >
                      Anteprima →
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CORSI ===== */}
      <section className="py-20 lg:py-28 bg-black/30 border-y border-zinc-900 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/3 blur-[150px] -z-10" />
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-14"
          >
            <Badge small textOnly>I Nostri Corsi</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-jakarta font-black text-white tracking-tight">
              Corsi <span className="text-orange-400">professionali.</span>
            </h2>
            <p className="text-zinc-400 font-medium text-base sm:text-lg mt-4">
              Dal frontend al backend, dall'AI al mobile: il percorso giusto per ogni developer.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 mt-5 text-sm font-black text-orange-400 hover:text-orange-300 transition-colors"
            >
              Vedi tutti i corsi →
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {COURSES_PREVIEW.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Link
                  href={`/courses/${course.id}`}
                    className="flex flex-col h-full bg-[#111] border border-zinc-800 rounded-2xl hover:border-orange-300/30 transition-all duration-500 overflow-hidden group no-underline"
                >
                  <div className="p-5 flex flex-col flex-1 gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: course.color || '#f97316' }}
                        />
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                          {course.tag}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 text-[9px] font-black rounded-md">
                        {course.level}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-white leading-snug group-hover:text-orange-300 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed line-clamp-2 flex-1">
                      {course.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {course.skills?.slice(0, 3).map((skill, j) => (
                        <span key={j} className="px-2 py-0.5 bg-zinc-900 text-zinc-500 text-[9px] font-bold rounded-md">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 mt-2 pt-3 border-t border-zinc-800/50">
                      <span className="flex items-center gap-1">
                        <BookOpen size={12} />
                        {course.duration}h
                      </span>
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-zinc-900/50 border-t border-zinc-800/50 flex items-center justify-between">
                    <span className="text-xs font-black text-white group-hover:text-orange-300 transition-colors flex items-center gap-1">
                      Scopri il corso <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== JOIN STACKUP ROOM ===== */}
      <section id="prezzi" className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-orange-500/5 to-transparent -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/5 blur-[150px] -z-10" />
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-16"
          >
            <Badge className="mx-auto">Entra in StackUp Room</Badge>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* Piano Gratuito */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              className="p-12 bg-[#111] border border-zinc-800 hover:border-orange-300/60 rounded-2xl relative flex flex-col transition-colors hover:shadow-[0_0_30px_oklch(.837_.128_66.29/.15)]"
            >
              <h3 className="text-2xl font-black text-white mb-3">Gratuito</h3>
              <div className="mb-5">
                <span className="text-5xl font-black text-white">€0</span>
                <span className="text-zinc-400 text-base font-medium ml-2">
                  per sempre
                </span>
              </div>
              <p className="text-lg text-zinc-400 font-medium mb-3">
                Per iniziare
              </p>
              <p className="text-base text-zinc-500 leading-relaxed mb-8">
                Inizia senza costi: esplora i corsi gratuiti, la community
                pubblica e le risorse open.
              </p>
              <ul className="space-y-2 mb-6 flex-1">
                {[
                  "Accesso ai corsi gratuiti",
                  "Community pubblica",
                  "Guide e risorse gratuite",
                  "Profilo nel portfolio",
                  "Accesso al catalogo corsi",
                ].map((f, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-zinc-300 font-medium"
                  >
                    <Check
                      size={14}
                      className="text-emerald-400 shrink-0 mt-0.5"
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={pricingHref}
                className="w-full py-4 bg-white text-black rounded-xl font-bold text-base hover:bg-zinc-200 transition-all text-center block"
              >
                {user ? "Vai ai corsi" : "Inizia Gratis"}
              </Link>
            </motion.div>

            {/* Piano Annuale */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ scale: 1.02 }}
              className="p-12 bg-[#111] border-2 border-orange-300 rounded-2xl relative flex flex-col shadow-[0_0_30px_oklch(.837_.128_66.29/.25)]"
            >
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-lg bg-orange-300 text-black text-[10px] font-black uppercase tracking-widest">
                Miglior Offerta
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Annuale</h3>
              <div className="mb-5">
                <span className="text-5xl font-black text-white">€297</span>
                <span className="text-zinc-400 text-base font-medium ml-2">
                  / anno
                </span>
                <div className="text-base text-orange-300 font-bold mt-1">
                  €24/mese
                </div>
              </div>
              <p className="text-lg text-zinc-400 font-medium mb-3">
                Impegno completo
              </p>
              <p className="text-base text-zinc-500 leading-relaxed mb-8">
                Accesso completo a tutto l'ecosistema con priorità nelle
                code review e accesso anticipato ai nuovi corsi.
              </p>
              <ul className="space-y-2 mb-6 flex-1">
                {[
                  "Accesso completo a tutti i corsi",
                  "Mentorship 1:1 settimanale",
                  "Community Discord privata",
                  "Risorse, template ed esempi per membri",
                  "AI workflows e skill training",
                  "Feedback su progetti reali",
                  "Check-in di accountability",
                  "Sessioni di co-working virtuale",
                  "Progetti reali in produzione",
                  "Career support & coaching",
                  "Priorità code review",
                  "Accesso anticipato ai nuovi corsi",
                ].map((f, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-zinc-300 font-medium"
                  >
                    <Check
                      size={14}
                      className="text-emerald-400 shrink-0 mt-0.5"
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={pricingHref}
                className="w-full py-4 bg-orange-300 text-black rounded-xl font-bold text-base hover:bg-orange-200 transition-all text-center block"
              >
                {pricingLabel}
              </Link>
            </motion.div>

            {/* Piano 6 Mesi */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="p-12 bg-[#111] border border-zinc-800 hover:border-orange-300/60 rounded-2xl relative flex flex-col transition-colors hover:shadow-[0_0_30px_oklch(.837_.128_66.29/.15)]"
            >
              <h3 className="text-2xl font-black text-white mb-3">6 Mesi</h3>
              <div className="mb-5">
                <span className="text-5xl font-black text-white">€147</span>
                <span className="text-zinc-400 text-base font-medium ml-2">
                  / 6 mesi
                </span>
                <div className="text-base text-zinc-500 font-medium mt-1">
                  €24/mese
                </div>
              </div>
              <p className="text-lg text-zinc-400 font-medium mb-3">
                Flessibilità per iniziare
              </p>
              <p className="text-base text-zinc-500 leading-relaxed mb-8">
                Il piano ideale per chi vuole testare il metodo StackUp Room con
                un impegno flessibile. Accesso completo a tutte le risorse e
                mentorship 1:1.
              </p>
              <ul className="space-y-2 mb-6 flex-1">
                {[
                  "Accesso completo a tutti i corsi",
                  "Mentorship 1:1 settimanale",
                  "Community Discord privata",
                  "Risorse, template ed esempi per membri",
                  "AI workflows e skill training",
                  "Feedback su progetti reali",
                  "Check-in di accountability",
                  "Sessioni di co-working virtuale",
                  "Progetti reali in produzione",
                  "Career support & coaching",
                ].map((f, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-zinc-300 font-medium"
                  >
                    <Check
                      size={14}
                      className="text-emerald-400 shrink-0 mt-0.5"
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={pricingHref}
                className="w-full py-4 bg-white text-black rounded-xl font-bold text-base hover:bg-zinc-200 transition-all text-center block"
              >
                {pricingLabel}
              </Link>
            </motion.div>

            {/* Piano 3 Mesi */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="p-12 bg-[#111] border border-zinc-800 hover:border-orange-300/60 rounded-2xl relative flex flex-col transition-colors hover:shadow-[0_0_30px_oklch(.837_.128_66.29/.15)]"
            >
              <h3 className="text-2xl font-black text-white mb-3">3 Mesi</h3>
              <div className="mb-5">
                <span className="text-5xl font-black text-white">€74</span>
              <span className="text-zinc-400 text-base font-medium ml-2">
                / 3 mesi
              </span>
              <div className="text-base text-zinc-500 font-medium mt-1">
                €24/mese
              </div>
            </div>
            <p className="text-lg text-zinc-400 font-medium mb-3">
              Il primo passo
            </p>
            <p className="text-base text-zinc-500 leading-relaxed mb-8">
              Il piano ideale per provare il metodo StackUp Room con un
              impegno minimo. Accesso completo a tutte le risorse e
              mentorship 1:1.
            </p>
            <ul className="space-y-2 mb-6 flex-1">
              {[
                "Accesso completo a tutti i corsi",
                "Mentorship 1:1 settimanale",
                "Community Discord privata",
                "Risorse, template ed esempi per membri",
                "AI workflows e skill training",
                "Feedback su progetti reali",
                "Check-in di accountability",
                "Sessioni di co-working virtuale",
                "Progetti reali in produzione",
                "Career support & coaching",
              ].map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-zinc-300 font-medium"
                >
                  <Check
                    size={14}
                    className="text-emerald-400 shrink-0 mt-0.5"
                  />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={pricingHref}
              className="w-full py-4 bg-white text-black rounded-xl font-bold text-base hover:bg-zinc-200 transition-all text-center block"
            >
              {pricingLabel}
            </Link>
            </motion.div>
          </div>

          <p className="text-center text-zinc-500 text-sm font-medium mt-8 max-w-lg mx-auto">
            Puoi annullare il rinnovo in qualsiasi momento. L'accesso rimarrà attivo per tutto il periodo per cui hai già pagato.
          </p>
        </div>
      </section>

      {/* ===== HO UNA DOMANDA ===== */}
      <section id="faq" className="py-20 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/3 blur-[150px] -z-10" />
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-16"
          >
            <Badge className="mx-auto">Domande Frequenti</Badge>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-6">
            {FAQ.map((item, idx) => (
              <motion.div
                key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="bg-[#111] border border-zinc-800 rounded-2xl px-6 sm:px-8 py-6"
              >
                <h3 className="text-lg font-bold text-zinc-200 mb-3">
                  {item.q}
                </h3>
                <p className="text-base text-zinc-400 font-medium leading-relaxed">
                  {highlightText(item.a)}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-10"
          >
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all"
            >
              Unisciti alla Community <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== PER CHI È FATTO ===== */}
      <section
        id="per-chi"
        className="py-20 lg:py-28 bg-black/30 border-y border-zinc-900 relative overflow-hidden"
      >
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-500/3 blur-[120px] -z-10" />
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-14"
          >
            <Badge className="mx-auto">Questo posto è per te se...</Badge>
          </motion.div>

          {/* Card quadrate */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
            {[
              {
                chi: "Principiante Determinato",
                desc: "Hai le basi ma non sai come passare al livello successivo. Ti serve un metodo e una guida.",
                icon: Rocket,
                color: "red",
              },
              {
                chi: "Cambio Carriera",
                desc: "Lavori in un settore che non ti dà più niente. Vuoi svoltare ma non sai da dove iniziare.",
                icon: RefreshCw,
                color: "blue",
              },
              {
                chi: "Sviluppatore in Stallo",
                desc: "Lavori già come developer ma senti la crescita rallentata. Vuoi sbloccare il tuo potenziale.",
                icon: Zap,
                color: "yellow",
              },
            ].map((item, i) => {
              const colors = {
                red: "bg-red-500/15 text-red-400",
                blue: "bg-blue-500/15 text-blue-400",
                yellow: "bg-yellow-500/15 text-yellow-400",
              };
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="p-8 bg-[#111] border border-zinc-800 rounded-2xl hover:border-orange-300/30 transition-all duration-500 flex flex-col items-center text-center aspect-square justify-center"
                >
                  <div
                    className={`w-14 h-14 flex items-center justify-center mb-4 rounded-xl ${colors[item.color as keyof typeof colors]}`}
                  >
                    <item.icon size={28} />
                  </div>
                <h3 className="text-lg font-black text-white mb-3">
                  {item.chi}
                </h3>
                <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
          </div>

          {/* Rettangolare verde */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            whileHover={{ scale: 1.02 }}
            className="max-w-5xl mx-auto p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-5"
            >
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                 <Check size={24} className="text-emerald-400" />
            </div>
            <div>
              <h4 className="text-base font-black text-emerald-400 mb-1">
                Perfetto per te se:
              </h4>
              <p className="text-sm text-zinc-300 font-medium leading-relaxed">
                Sei determinato, hai voglia di studiare e vuoi risultati veri.
                Non ti accontenti di tutorial sparsi: cerchi un percorso
              strutturato con mentorship 1:1 e progetti reali. Da principiante
              a developer, con il metodo giusto.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== ABOUT ME ===== */}
      <section className="py-20 lg:py-28 bg-black/30 border-y border-zinc-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-orange-500/3 blur-[120px] -z-10" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-500/3 blur-[100px] -z-10" />
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center mb-10"
          >
            <Badge className="mx-auto">
              Gabriele <span className="text-orange-400">Forestieri</span>
            </Badge>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="flex justify-center mb-12"
          >
            <div className="w-72 h-72 sm:w-80 sm:h-80 bg-linear-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/10 rounded-2xl flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 to-transparent" />
              <div className="text-center relative z-10">
                <div className="w-24 h-24 mx-auto mb-4 bg-linear-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-zinc-500">Gabriele Forestieri</span>
              </div>
            </div>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="max-w-3xl mx-auto space-y-5 text-zinc-400 font-medium leading-[1.8] text-base sm:text-lg mb-12"
          >
            <p>
              Ho iniziato a programmare da autodidatta, come tanti. Dopo anni passati a scrivere
              codice in startup e aziende tecnologiche, ho capito una cosa: il modo in cui si
              insegna la programmazione è rotto. Troppa teoria, corsi infiniti, nessuna esperienza
              reale. Si esce da bootcamp e università senza sapere gestire un deploy, leggere
              codice legacy o contribuire a un team.
            </p>
            <p>
              Ho fondato StackUp Room per colmare quel divario. Ogni corso, ogni progetto e ogni
              sessione di mentoring è costruita sulla mia esperienza sul campo: niente fluff,
              niente tutorial infiniti. Solo competenze concrete, architetture reali e flussi di
              lavoro che troverai davvero in azienda. Non insegno a programmare, insegno a
              <span className="text-zinc-300"> costruire software che qualcuno paga.</span>
            </p>

            <div className="w-full h-48 sm:h-64 bg-linear-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-xl flex items-center justify-center my-8 overflow-hidden relative">
              <div className="absolute inset-0 bg-linear-to-t from-orange-500/3 to-transparent" />
              <div className="text-center relative z-10">
                <div className="w-16 h-16 mx-auto mb-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.007-1.875 2.25-1.875s2.25.84 2.25 1.875c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959v0c0 .333.228.586.532.64 1.63.289 3.304.443 5.009.457a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.036 1.007-1.875 2.25-1.875s2.25.84 2.25 1.875c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959v0c0 .32.21.561.497.602a47.15 47.15 0 006.872-.514" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-zinc-500">Dashboard interattiva</span>
              </div>
            </div>

            <p>
              Il mio metodo si basa su un principio semplice: si impara costruendo, non guardando.
              Ogni modulo si conclude con un progetto pubblicato, ogni skill è scelta in base alla
              domanda del mercato. Non troverai esercizi inutili o teoria fine a sé stessa.
            </p>
            <p>
              Oggi aiuto sviluppatori a fare il salto da junior a professionisti pronti per
              aziende top tier o per lanciare i propri prodotti. Il feedback che ricevo più spesso?
              "Perché nessuno mi ha mai insegnato queste cose prima d'ora." È per questo che
              continuo a costruire StackUp Room.
            </p>

            <div className="w-full h-48 sm:h-64 bg-linear-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-xl flex items-center justify-center my-8 overflow-hidden relative">
              <div className="absolute inset-0 bg-linear-to-t from-orange-500/3 to-transparent" />
              <div className="text-center relative z-10">
                <div className="w-16 h-16 mx-auto mb-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-zinc-500">Sessione di mentoring</span>
              </div>
            </div>
          </motion.div>



          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/register"
              className="px-8 py-3.5 bg-orange-600 text-white font-bold text-sm hover:bg-orange-500 transition-all rounded-xl shadow-lg shadow-orange-500/20 inline-flex items-center gap-2"
            >
              Inizia il percorso <ArrowRight size={16} />
            </Link>
            <Link
              href="/courses"
              className="px-8 py-3.5 bg-black border border-zinc-800 text-zinc-200 font-bold text-sm hover:border-orange-400 hover:text-orange-400 transition-all rounded-xl inline-flex items-center gap-2"
            >
              Esplora i corsi
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== COSA OTTERRAI ===== */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-orange-500/3 blur-[100px] -z-10" />
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-16"
          >
            <Badge className="mx-auto">
              Cosa ottieni entrando in{" "}
              <span className="text-orange-400">StackUp Room</span>
            </Badge>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Star,
                title: "Piano Personalizzato",
                desc: "Ogni membro ha un percorso su misura basato sulle proprie competenze e obiettivi di carriera.",
                gradient: "from-orange-500/10 via-orange-500/5 to-transparent",
              },
              {
                icon: Users,
                title: "Mentoring Settimanale",
                desc: "Sessioni 1:1 con me per code review, career advice e sblocco dei nodi critici.",
                gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
              },
              {
                icon: Rocket,
                title: "Progetti in Produzione",
                desc: "Costruisci prodotti veri che vanno live. Il tuo portfolio parlerà da solo.",
                gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
              },
              {
                icon: Target,
                title: "Career Accelerator",
                desc: "Preparazione colloqui, ottimizzazione CV, LinkedIn strategy e networking mirato.",
                gradient: "from-purple-500/10 via-purple-500/5 to-transparent",
              },
            ].map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="bg-[#111] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col"
              >
                <div className={`flex items-center justify-center p-8 bg-linear-to-br ${benefit.gradient} border-b border-zinc-800`}>
                  <motion.div
                    animate={{
                      scale: [1, 1.15, 1],
                      rotate: [0, 30, 0],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-16 h-16 flex items-center justify-center"
                  >
                    <benefit.icon size={28} className="text-white" />
                  </motion.div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-black text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                    {benefit.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== GUIDES ===== */}
      <section className="py-20 lg:py-28 bg-black/30 border-y border-zinc-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/3 blur-[150px] -z-10" />
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-14"
          >
            <Badge small textOnly>Guide</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-jakarta font-black text-white tracking-tight">
              Guide pratiche per{" "}
              <span className="text-orange-400">sviluppare.</span>
            </h2>
            <p className="text-zinc-400 font-medium text-base sm:text-lg mt-4">
              Dalla teoria al codice: guide pratiche per costruire, lanciare e monetizzare la tua idea.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16 max-w-5xl mx-auto">
            {GUIDE_CARDS.map((guide, i) => {
              const Icon = guide.icon;
              return (
                <motion.div
                  key={guide.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="p-6 bg-[#111] border border-zinc-800 rounded-2xl hover:border-orange-300/30 transition-all duration-500 flex flex-col"
                >
                  <div className="w-10 h-10 bg-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center mb-4">
                    <Icon size={20} />
                  </div>
                  <span className="inline-block px-2.5 py-1 bg-zinc-900 text-zinc-400 text-[9px] font-black uppercase tracking-widest rounded-lg mb-3 self-start">
                    {guide.tag}
                  </span>
                  <h3 className="text-base font-black text-white mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-zinc-400 font-medium leading-relaxed flex-1">
                    {guide.desc}
                  </p>
                  <Link
                    href={guide.href}
                    className="mt-4 text-sm font-black text-orange-400 hover:text-orange-300 transition-colors inline-flex items-center gap-1"
                  >
                    Leggi →
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Separator */}
          <div className="relative mb-16">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-6 py-2 bg-black text-zinc-500 text-[10px] font-black uppercase tracking-[0.25em] border border-zinc-800 rounded-full">
                Oppure segui un percorso
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-12"
          >
            <Badge small textOnly>Percorsi di Carriera</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-jakarta font-black text-white tracking-tight">
              Percorsi di{" "}
              <span className="text-orange-400">carriera.</span>
            </h2>
            <p className="text-zinc-400 font-medium text-base sm:text-lg mt-4">
              Scegli il tuo percorso e diventa membro per sbloccare tutto.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {PATHS.map((path, i) => {
              const colorMap: Record<string, string> = {
                orange: "bg-orange-500/15 text-orange-400",
                blue: "bg-blue-500/15 text-blue-400",
                purple: "bg-purple-500/15 text-purple-400",
                emerald: "bg-emerald-500/15 text-emerald-400",
              };
              const iconMap: Record<string, React.ReactNode> = {
                orange: <Code size={18} />,
                blue: <Code size={18} />,
                purple: <Star size={18} />,
                emerald: <Code size={18} />,
              };
              return (
                <motion.div
                  key={path.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link
                    href={path.href}
                  className="flex flex-col h-full bg-[#111] border border-zinc-800 rounded-2xl hover:border-orange-300/30 transition-all duration-500 overflow-hidden group no-underline"
                  >
                    <div className="p-5 flex flex-col flex-1 gap-3">
                      <div className="flex items-start justify-between">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[path.color] || colorMap.orange}`}>
                          {iconMap[path.color] || <Code size={18} />}
                        </div>
                        <span className="px-2.5 py-1 bg-zinc-900 text-zinc-400 text-[10px] font-black rounded-lg">
                          {path.duration}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-white leading-snug group-hover:text-orange-300 transition-colors">
                        {path.title}
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed line-clamp-2">
                        {path.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {path.highlights.slice(0, 2).map((h, j) => (
                          <span key={j} className="px-2 py-0.5 bg-zinc-900 text-zinc-500 text-[9px] font-bold rounded-md">{h}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-500 mt-2 pt-3 border-t border-zinc-800/50">
                        <span className="flex items-center gap-1"><BookOpen size={12} />{path.courses} corsi</span>
                      </div>
                    </div>
                    <div className="px-5 py-3 bg-zinc-900/50 border-t border-zinc-800/50 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold"><Lock size={11} />Membri</span>
                      <span className="text-xs font-black text-white group-hover:text-orange-300 transition-colors flex items-center gap-1">Scopri <ArrowRight size={12} /></span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-center"
          >
            <p className="text-zinc-400 font-medium text-base mb-6">
              Vuoi il piano completo in 6 step per lanciare la tua Startup AI da solo?
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/paths"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all group"
              >
                Vedi tutti i percorsi{" "}
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/guide"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-black border border-zinc-800 text-zinc-200 rounded-xl font-bold text-sm hover:border-zinc-600 transition-all group"
              >
                Vai alla Guida Founder{" "}
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;