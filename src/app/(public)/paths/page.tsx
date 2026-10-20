"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, ArrowRight, Clock, BookOpen, Star, Code, Terminal, Database, Smartphone, Cloud, Brain, BarChart, Shield, CheckCircle, Users, TrendingUp } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { PATHS } from "@/data/landingData";

const pathMeta: Record<string, { icon: React.ElementType; tech: string }> = {
  frontend: { icon: Code, tech: "html5" },
  backend: { icon: Terminal, tech: "nodedotjs" },
  fullstack: { icon: Database, tech: "nextdotjs" },
  mobile: { icon: Smartphone, tech: "react" },
  devops: { icon: Cloud, tech: "docker" },
  "ai-ml": { icon: Brain, tech: "python" },
  "data-science": { icon: BarChart, tech: "postgresql" },
  cybersecurity: { icon: Shield, tech: "lock" },
};

const colorMap: Record<string, { bg: string; text: string; border: string; subtle: string }> = {
  orange: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/20", subtle: "bg-orange-500/5" },
  blue: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/20", subtle: "bg-blue-500/5" },
  purple: { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/20", subtle: "bg-purple-500/5" },
  emerald: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/20", subtle: "bg-emerald-500/5" },
  cyan: { bg: "bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/20", subtle: "bg-cyan-500/5" },
  pink: { bg: "bg-pink-500/15", text: "text-pink-400", border: "border-pink-500/20", subtle: "bg-pink-500/5" },
  yellow: { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/20", subtle: "bg-yellow-500/5" },
  red: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/20", subtle: "bg-red-500/5" },
};

const PathsPage = () => {
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://stackup.academy').replace(/\/$/, '');
  const pathsItemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: PATHS.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.title,
      url: `${siteUrl}${p.href}`,
    })),
  };
  const pathsBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Percorsi', item: `${siteUrl}/paths` },
    ],
  };

  return (
    <div className="bg-[#0a0a0a] min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pathsItemList).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pathsBreadcrumb).replace(/</g, '\\u003c') }} />
      <section className="pt-28 pb-20 lg:pb-28 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-orange-500/5 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange-500/8 blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <Badge small>Percorsi di Carriera</Badge>
            <h1 className="max-w-5xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-7xl mt-4 mb-4 mx-auto">
              Scegli il tuo{" "}
              <span className="text-orange-400">percorso.</span>
            </h1>
            <p className="text-zinc-400 font-medium text-base sm:text-lg max-w-xl mx-auto">
              Ogni percorso include lezioni gratuite per iniziare subito. Sblocca tutto diventando membro di Stackup Room.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PATHS.map((path, i) => {
              const meta = pathMeta[path.id] || { icon: Code, tech: "code" };
              const Icon = meta.icon;
              const c = colorMap[path.color] || colorMap.orange;
              return (
                <motion.div
                  key={path.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={path.href}
                    className="flex flex-col h-full bg-[#111] border border-zinc-800 rounded-2xl hover:border-orange-300/30 transition-all duration-500 overflow-hidden group no-underline"
                  >
                    {/* Tech image header */}
                    <div className={`relative h-20 ${c.subtle} flex items-center justify-center overflow-hidden`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://cdn.simpleicons.org/${meta.tech}`}
                        alt={path.title}
                        width={40}
                        height={40}
                        loading="lazy"
                        className="h-10 w-10 object-contain opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                        crossOrigin="anonymous"
                      />
                      <div className={`absolute bottom-2 left-3 w-9 h-9 ${c.bg} ${c.text} rounded-xl flex items-center justify-center`}>
                        <Icon size={18} />
                      </div>
                      <div className="absolute bottom-2 right-3">
                        <span className="px-2 py-1 bg-[#111] text-zinc-400 text-[9px] font-black rounded-lg backdrop-blur-sm">
                          {path.duration}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1 gap-3">
                      <h3 className="text-sm font-black text-white leading-snug group-hover:text-orange-300 transition-colors">
                        {path.title}
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed line-clamp-2">
                        {path.description}
                      </p>

                      <div className="flex flex-wrap gap-1 mt-auto">
                        {path.highlights.slice(0, 2).map((h, j) => (
                          <span key={j} className="px-2 py-0.5 bg-zinc-900 text-zinc-500 text-[9px] font-bold rounded-md">
                            {h}
                          </span>
                        ))}
                        {path.highlights.length > 2 && (
                          <span className="px-2 py-0.5 bg-zinc-900 text-zinc-600 text-[9px] font-bold rounded-md">
                            +{path.highlights.length - 2}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-500 mt-2 pt-3 border-t border-zinc-800/50">
                        <span className="flex items-center gap-1">
                          <BookOpen size={12} />
                          {path.courses} corsi
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Star size={12} />
                          {path.freeLessons} gratis
                        </span>
                      </div>
                    </div>

                    <div className="px-5 py-3 bg-zinc-900/50 border-t border-zinc-800/50 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold">
                        <Lock size={11} />
                        Membri
                      </span>
                      <span className="text-xs font-black text-white group-hover:text-orange-300 transition-colors flex items-center gap-1">
                        Scopri <ArrowRight size={12} />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* ===== STATS SECTION ===== */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto mt-16"
          >
            {[
              { value: '8', label: 'Percorsi' },
              { value: '18', label: 'Corsi' },
              { value: '100%', label: 'Hands-on' },
              { value: '1:1', label: 'Mentoring' },
            ].map((stat, i) => (
              <div key={i} className="p-6 bg-black/40 border border-zinc-800 rounded-xl text-center">
                <div className="text-2xl sm:text-3xl font-black text-white">{stat.value}</div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* ===== FEATURES SECTION ===== */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16"
          >
            <h2 className="text-xl sm:text-2xl font-jakarta font-black text-white tracking-tight text-center mb-8">
              Perché scegliere un percorso <span className="text-orange-400">Stackup</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                { icon: CheckCircle, title: 'Curriculum strutturato', desc: 'Ogni percorso è progettato da senior engineer per portarti da dove sei a dove vuoi arrivare.' },
                { icon: Users, title: 'Mentoring 1:1', desc: 'Sessioni settimanali con mentor che hanno esperienza reale in aziende top tier.' },
                { icon: TrendingUp, title: 'Career support', desc: 'CV, colloqui tecnici e personal branding per accelerare la tua carriera.' },
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center mt-12"
          >
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all"
            >
              Diventa membro e sblocca tutti i percorsi <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default PathsPage;