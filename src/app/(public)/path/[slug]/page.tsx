'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Rocket, CheckCircle, ArrowRight, Lock, Code2,
  Clock, BookOpen, Star, Zap, Award, Target, Users, TrendingUp,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { PATHS } from '@/data/landingData';

const PATH_MODULES: Record<string, { title: string; lessons: { name: string; free: boolean }[] }[]> = {
  frontend: [
    {
      title: 'Fondamenti',
      lessons: [
        { name: 'HTML semantico & accessibilità', free: true },
        { name: 'CSS moderno: Flexbox, Grid, variabili', free: true },
        { name: 'JavaScript: DOM, eventi, fetch', free: true },
        { name: 'TypeScript: tipi, interfacce, generics', free: false },
        { name: 'Strumenti: Vite, ESLint, Prettier', free: false },
        { name: 'Debugging e DevTools avanzati', free: true },
      ],
    },
    {
      title: 'React & Modern Frontend',
      lessons: [
        { name: 'Componenti, props e state', free: true },
        { name: 'Hooks: useEffect, useContext, custom hooks', free: false },
        { name: 'State management con Zustand', free: false },
        { name: 'Next.js: routing, SSR, server actions', free: false },
        { name: 'Performance: code splitting, lazy loading', free: false },
        { name: 'Server Components e Streaming SSR', free: false },
      ],
    },
    {
      title: 'Design System & CSS Avanzato',
      lessons: [
        { name: 'Tailwind: utility-first workflow', free: true },
        { name: 'Design tokens e temi dinamici', free: false },
        { name: 'Componenti accessibili (aria, keyboard)', free: false },
        { name: 'Animazioni CSS e Framer Motion', free: false },
        { name: 'Responsive senza media query', free: false },
      ],
    },
    {
      title: 'Testing & Qualità',
      lessons: [
        { name: 'Unit test con Vitest', free: false },
        { name: 'Integration test con Testing Library', free: false },
        { name: 'E2E test con Playwright', free: false },
        { name: 'Lighthouse e Core Web Vitals', free: false },
        { name: 'Code review e best practices', free: false },
      ],
    },
    {
      title: 'Progetti & Portfolio',
      lessons: [
        { name: 'Progetto: dashboard interattiva', free: false },
        { name: 'Progetto: app e-commerce', free: false },
        { name: 'Progetto: blog con CMS headless', free: false },
        { name: 'Deploy e CI/CD', free: false },
        { name: 'Review & ottimizzazione portfolio', free: false },
      ],
    },
  ],
  backend: [
    {
      title: 'Fondamenti Backend',
      lessons: [
        { name: 'Node.js: runtime, moduli, stream', free: true },
        { name: 'API REST con Express', free: true },
        { name: 'Database SQL: PostgreSQL', free: true },
        { name: 'Autenticazione: JWT, OAuth, sessioni', free: false },
        { name: 'ORM: Prisma, Drizzle', free: false },
        { name: 'Environment e variabili d\'ambiente', free: true },
      ],
    },
    {
      title: 'API & Architettura',
      lessons: [
        { name: 'GraphQL vs REST: quando e perché', free: true },
        { name: 'Validazione e testing API', free: false },
        { name: 'WebSocket e real-time', free: false },
        { name: 'Design pattern backend', free: false },
        { name: 'Caching con Redis', free: false },
        { name: 'Rate limiting e sicurezza API', free: false },
      ],
    },
    {
      title: 'Database & Data Modeling',
      lessons: [
        { name: 'Modellazione dati: ERD e normalizzazione', free: true },
        { name: 'Migrazioni e seeding', free: false },
        { name: 'Query ottimizzate e indici', free: false },
        { name: 'Database NoSQL: MongoDB', free: false },
        { name: 'Transazioni e concorrenza', free: false },
      ],
    },
    {
      title: 'Testing & Sicurezza Backend',
      lessons: [
        { name: 'Test unitari con Jest', free: false },
        { name: 'Test di integrazione e supertest', free: false },
        { name: 'OWASP: injection, XSS, CSRF', free: false },
        { name: 'Gestione errori e logging', free: false },
        { name: 'Audit e vulnerabilità npm', free: false },
      ],
    },
    {
      title: 'DevOps & Deploy',
      lessons: [
        { name: 'Docker per sviluppatori', free: true },
        { name: 'CI/CD con GitHub Actions', free: false },
        { name: 'Cloud deploy: Railway, Fly.io', free: false },
        { name: 'Monitoring e logging', free: false },
        { name: 'Scaling: verticale vs orizzontale', free: false },
      ],
    },
  ],
  fullstack: [
    {
      title: 'Fullstack Foundations',
      lessons: [
        { name: 'Architettura fullstack: pattern e scelte', free: true },
        { name: 'Next.js come fullstack framework', free: true },
        { name: 'Database design e relazioni', free: true },
        { name: 'API routes e server actions', free: true },
        { name: 'Autenticazione end-to-end', free: true },
        { name: 'Routing e Middleware', free: true },
      ],
    },
    {
      title: 'Frontend Avanzato',
      lessons: [
        { name: 'Design system e componenti atomici', free: false },
        { name: 'Animazioni con Framer Motion', free: false },
        { name: 'Ottimizzazione performance frontend', free: false },
        { name: 'Gestione stato globale (Zustand)', free: false },
        { name: 'Test: unit, integration, e2e', free: false },
      ],
    },
    {
      title: 'Backend & Infrastruttura',
      lessons: [
        { name: 'Microservizi vs monolite', free: false },
        { name: 'Sistema di code e job queue', free: false },
        { name: 'Upload file e gestione asset', free: false },
        { name: 'Deploy multi-ambiente', free: false },
        { name: 'System design per il colloquio', free: false },
      ],
    },
    {
      title: 'Database & Auth Avanzato',
      lessons: [
        { name: 'PostgreSQL: trigger, funzioni, window', free: false },
        { name: 'Redis: sessioni, code, caching', free: false },
        { name: 'OAuth 2.0 e OIDC provider esterni', free: false },
        { name: 'Row Level Security e policy', free: false },
        { name: 'Backup e disaster recovery', free: false },
      ],
    },
    {
      title: 'Progetto Capstone',
      lessons: [
        { name: 'Pianificazione e architettura', free: false },
        { name: 'Implementazione fullstack', free: false },
        { name: 'Testing e QA completo', free: false },
        { name: 'Deploy su domini personalizzati', free: false },
        { name: 'Presentazione e code review', free: false },
      ],
    },
  ],
  mobile: [
    {
      title: 'React Native Basics',
      lessons: [
        { name: 'Setup e primo progetto', free: true },
        { name: 'Componenti nativi e styling', free: true },
        { name: 'Navigazione e routing', free: true },
        { name: 'State management mobile', free: false },
        { name: 'API e networking', free: false },
        { name: 'Expo vs React Native CLI', free: true },
      ],
    },
    {
      title: 'App Complete',
      lessons: [
        { name: 'Gestione immagini e file', free: false },
        { name: 'Form e validazione input', free: false },
        { name: 'Notifiche push', free: false },
        { name: 'Geolocalizzazione e mappe', free: false },
        { name: 'Auth: biometrico, social login', free: false },
      ],
    },
    {
      title: 'Advanced Mobile Features',
      lessons: [
        { name: 'Animazioni con Reanimated', free: false },
        { name: 'Offline-first con WatermelonDB', free: false },
        { name: 'WebView e bridging nativo', free: false },
        { name: 'Payments: Stripe, Apple Pay', free: false },
        { name: 'Deep linking e widget', free: false },
      ],
    },
    {
      title: 'Production & Deploy',
      lessons: [
        { name: 'Test su device reali e simulatori', free: false },
        { name: 'CodePush e aggiornamenti OTA', free: false },
        { name: 'Pubblicazione su App Store', free: false },
        { name: 'Pubblicazione su Play Store', free: false },
        { name: 'Monetizzazione e analytics', free: false },
        { name: 'ASO: App Store Optimization', free: false },
      ],
    },
  ],
  devops: [
    {
      title: 'Container & Orchestrazione',
      lessons: [
        { name: 'Docker: immagini, container, compose', free: true },
        { name: 'Dockerfile multi-stage', free: true },
        { name: 'Kubernetes: pod, deployment, service', free: true },
        { name: 'Helm e gestione configurazioni', free: false },
        { name: 'Service mesh: Istio, Linkerd', free: false },
        { name: 'Networking K8s: Ingress, DNS', free: false },
      ],
    },
    {
      title: 'CI/CD & Cloud',
      lessons: [
        { name: 'Pipeline CI/CD da zero', free: true },
        { name: 'GitHub Actions avanzato', free: false },
        { name: 'Terraform e IaC', free: false },
        { name: 'Cloud AWS/GCP/Azure basics', free: false },
        { name: 'Serverless: Lambda, Cloud Functions', free: false },
      ],
    },
    {
      title: 'Infrastructure & Monitoring',
      lessons: [
        { name: 'Monitoring: Prometheus, Grafana', free: false },
        { name: 'Logging centralizzato: Loki, ELK', free: false },
        { name: 'Alerting e on-call setup', free: false },
        { name: 'Auto-scaling e HPA', free: false },
        { name: 'Chaos engineering', free: false },
      ],
    },
    {
      title: 'Security & Compliance',
      lessons: [
        { name: 'Container security: Trivy, Falco', free: false },
        { name: 'Secret management: Vault, SOPS', free: false },
        { name: 'Network policy e zero-trust', free: false },
        { name: 'Audit e compliance cloud', free: false },
        { name: 'Disaster recovery planning', free: false },
      ],
    },
  ],
  'ai-ml': [
    {
      title: 'Python ML Stack',
      lessons: [
        { name: 'Python per data science', free: true },
        { name: 'Pandas, NumPy, scikit-learn', free: true },
        { name: 'Feature engineering e preprocessing', free: true },
        { name: 'Deep learning con PyTorch', free: false },
        { name: 'Computer Vision con OpenCV', free: false },
        { name: 'NLP: spaCy, transformers', free: false },
      ],
    },
    {
      title: 'LLM & Generative AI',
      lessons: [
        { name: 'LLM: OpenAI, Claude, open-source', free: false },
        { name: 'Prompt engineering avanzato', free: true },
        { name: 'RAG e vector database', free: false },
        { name: 'Fine-tuning modelli open-source', free: false },
        { name: 'Multimodal AI: immagini, audio', free: false },
      ],
    },
    {
      title: 'AI Agents & Deploy',
      lessons: [
        { name: 'LangChain e AI agents', free: true },
        { name: 'Tool calling e function calling', free: false },
        { name: 'CrewAI: multi-agent systems', free: false },
        { name: 'Deploy modelli in produzione', free: false },
        { name: 'Model serving: vLLM, TGI', free: false },
      ],
    },
    {
      title: 'MLOps & Production',
      lessons: [
        { name: 'MLflow: experiment tracking', free: false },
        { name: 'Feature store e versioning', free: false },
        { name: 'Model monitoring e drift', free: false },
        { name: 'A/B testing per ML models', free: false },
        { name: 'Responsible AI e bias detection', free: false },
      ],
    },
  ],
  'data-science': [
    {
      title: 'Analisi & Visualizzazione',
      lessons: [
        { name: 'SQL avanzato per analytics', free: true },
        { name: 'Python: pandas, matplotlib, seaborn', free: true },
        { name: 'Dashboard: Tableau, Looker, Metabase', free: false },
        { name: 'Statistical modelling & A/B testing', free: false },
        { name: 'Time series analysis', free: false },
        { name: 'Data storytelling: teoria e pratica', free: true },
      ],
    },
    {
      title: 'Data Engineering',
      lessons: [
        { name: 'ETL/ELT pipeline', free: true },
        { name: 'Big data: Spark, dbt', free: false },
        { name: 'Data warehousing: Star schema', free: false },
        { name: 'Data lake vs data mesh', free: false },
        { name: 'Orchestrazione: Airflow, Prefect', free: false },
      ],
    },
    {
      title: 'Advanced Analytics',
      lessons: [
        { name: 'Machine learning supervisionato', free: false },
        { name: 'Feature selection e riduzione', free: false },
        { name: 'Hyperparameter tuning', free: false },
        { name: 'Ensemble: Random Forest, XGBoost', free: false },
        { name: 'Clustering e segmentazione', free: false },
      ],
    },
    {
      title: 'Business Intelligence',
      lessons: [
        { name: 'KPI design e metriche aziendali', free: false },
        { name: 'Automazione report settimanali', free: false },
        { name: 'Self-service analytics', free: false },
        { name: 'Real-time analytics con Kafka', free: false },
        { name: 'Strumenti: Metabase, Superset', free: false },
      ],
    },
  ],
  cybersecurity: [
    {
      title: 'Fondamenti Security',
      lessons: [
        { name: 'Network security fundamentals', free: true },
        { name: 'Ethical hacking: metodologia', free: true },
        { name: 'Web security: OWASP Top 10', free: true },
        { name: 'Crittografia: simmetrica, asimmetrica', free: false },
        { name: 'PKI, certificati e HTTPS', free: false },
        { name: 'OSINT e footprinting', free: true },
      ],
    },
    {
      title: 'Security Operations',
      lessons: [
        { name: 'SIEM: SOC, event correlation', free: false },
        { name: 'Threat hunting e IoC', free: false },
        { name: 'Penetration testing: web, network', free: false },
        { name: 'Red team vs Blue team', free: false },
        { name: 'Incident response playbook', free: false },
      ],
    },
    {
      title: 'Application Security',
      lessons: [
        { name: 'Secure coding practices', free: false },
        { name: 'SAST, DAST, SCA tools', free: false },
        { name: 'API security: OAuth, JWT, rate limit', free: false },
        { name: 'Cloud security: AWS, Azure', free: false },
        { name: 'Mobile app security', free: false },
        { name: 'Bug bounty: strategia e piattaforme', free: false },
      ],
    },
    {
      title: 'Governance & Compliance',
      lessons: [
        { name: 'GDPR: implementazione pratica', free: false },
        { name: 'SOC 2, ISO 27001 framework', free: false },
        { name: 'DPIA e risk assessment', free: false },
        { name: 'Security awareness training', free: false },
        { name: 'Audit: preparazione e gestione', free: false },
      ],
    },
  ],
};

const pathIcons: Record<string, React.ElementType> = {
  frontend: Code2,
  backend: Target,
  fullstack: Zap,
  mobile: Rocket,
  devops: Rocket,
  'ai-ml': Zap,
  'data-science': Award,
  cybersecurity: Lock,
};

const colorMap: Record<string, string> = {
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const PathSlugPage: React.FC = () => {
  const params = useParams();
  const slug = params?.slug as string;

  const path = PATHS.find((p) => p.href === `/path/${slug}`);

  if (!path) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-black text-white mb-4">Percorso non trovato</h1>
        <p className="text-zinc-400 font-medium mb-8">Il percorso che cerchi non esiste o è stato rimosso.</p>
        <Link
          href="/paths"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all"
        >
          Torna ai percorsi <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const modules = PATH_MODULES[path.id];
  const Icon = pathIcons[path.id] || Rocket;
  const colorClasses = colorMap[path.color] || colorMap.orange;
  const freeCount = modules
    ? modules.reduce((acc, m) => acc + m.lessons.filter((l) => l.free).length, 0)
    : 0;
  const totalCount = modules
    ? modules.reduce((acc, m) => acc + m.lessons.length, 0)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto px-6 py-12 sm:py-16"
    >
      <Link
        href="/paths"
        className="text-sm text-zinc-500 hover:text-zinc-300 font-medium mb-6 inline-flex items-center gap-1 transition-colors"
      >
        ← Torna ai percorsi
      </Link>

      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 ${colorClasses} rounded-xl flex items-center justify-center`}>
            <Icon size={22} />
          </div>
          <Badge small>{path.tag}</Badge>
        </div>
        <h1 className="max-w-5xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-7xl">
          {path.title}
        </h1>
        <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-2xl">
          {path.description}
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-zinc-500 font-bold">
          <span className="flex items-center gap-1.5">
            <Clock size={16} />
            {path.duration}
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen size={16} />
            {path.courses} corsi
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Star size={16} />
            {freeCount} lezioni gratuite su {totalCount}
          </span>
        </div>
      </section>

      {modules && (
        <section className="mb-16">
          <h2 className="text-xl sm:text-2xl font-jakarta font-black text-white tracking-tight mb-8">
            Curriculum del percorso
          </h2>
          <div className="space-y-6">
            {modules.map((mod, mi) => (
              <motion.div
                key={mi}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: mi * 0.08 }}
                className="bg-black/40 border border-zinc-800 rounded-2xl overflow-hidden"
              >
                <div className="px-6 py-4 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="text-sm font-black text-white">
                    <span className="text-zinc-500 mr-2">Modulo {mi + 1}</span>
                    {mod.title}
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-bold">
                    {mod.lessons.filter((l) => l.free).length} gratis
                  </span>
                </div>
                <ul className="divide-y divide-zinc-800/50">
                  {mod.lessons.map((lesson, li) => (
                    <li
                      key={li}
                      className="px-6 py-3.5 flex items-center gap-3 text-sm"
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          lesson.free ? 'bg-emerald-500' : 'bg-zinc-700'
                        }`}
                      />
                      <span
                        className={`font-medium flex-1 ${
                          lesson.free ? 'text-zinc-200' : 'text-zinc-500'
                        }`}
                      >
                        {lesson.name}
                      </span>
                      {lesson.free ? (
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">
                          Gratis
                        </span>
                      ) : (
                        <Lock size={12} className="text-zinc-600 shrink-0" />
                      )}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-16">
        <h2 className="text-xl sm:text-2xl font-jakarta font-black text-white tracking-tight mb-6">
          Cosa imparerai
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {path.highlights.map((h, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 bg-black/40 border border-zinc-800 rounded-xl"
            >
              <CheckCircle size={16} className="text-emerald-500 shrink-0" />
              <span className="text-sm text-zinc-300 font-medium">{h}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== SKILLS SECTION ===== */}
      <section className="mb-16">
        <h2 className="text-xl sm:text-2xl font-jakarta font-black text-white tracking-tight mb-6">
          Competenze che acquisirai
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { skill: 'Problem Solving', desc: 'Impara a scomporre problemi complessi in soluzioni modulari e manutenibili.' },
            { skill: 'Clean Code', desc: 'Scrivi codice leggibile, testabile e che altri sviluppatori possano capire.' },
            { skill: 'Architettura Software', desc: 'Progetta sistemi scalabili usando pattern e best practice del settore.' },
            { skill: 'DevOps & Deploy', desc: 'Container, CI/CD e cloud: porta il tuo codice in produzione con sicurezza.' },
            { skill: 'Team Collaboration', desc: 'Git, code review e metodologie agili per lavorare in team professionali.' },
            { skill: 'Career Readiness', desc: 'CV, colloqui tecnici e personal branding per il mondo del lavoro.' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="p-5 bg-black/40 border border-zinc-800 rounded-xl hover:border-orange-300/30 transition-all duration-500"
            >
              <h3 className="text-sm font-black text-white mb-1.5">{item.skill}</h3>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="mb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: path.duration, label: 'Durata' },
            { value: `${path.courses}`, label: 'Corsi' },
            { value: `${freeCount}`, label: 'Lezioni gratuite' },
            { value: '1:1', label: 'Mentoring' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="p-5 bg-black/40 border border-zinc-800 rounded-xl text-center"
            >
              <div className="text-xl sm:text-2xl font-black text-white">{stat.value}</div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== FAQ PERCORSO ===== */}
      <section className="mb-16">
        <h2 className="text-xl sm:text-2xl font-jakarta font-black text-white tracking-tight mb-6">
          Domande frequenti sul percorso
        </h2>
        <div className="space-y-4">
          {[
            { q: 'Quanto tempo devo dedicare ogni settimana?', a: 'Consigliamo almeno 10-15 ore a settimana per completare il percorso nei tempi previsti. Puoi studiare al tuo ritmo, ma la costanza è la chiave.' },
            { q: 'Servono conoscenze pregresse?', a: 'Dipende dal percorso. Alcuni partono da zero, altri richiedono basi di programmazione. Controlla i requisiti specifici di ogni percorso.' },
            { q: 'Come funziona il mentoring 1:1?', a: 'Ogni membro ha sessioni settimanali con un mentor senior per code review, chiarimenti e career advice personalizzato.' },
            { q: 'Posso cambiare percorso durante il programma?', a: 'Sì, sei flessibile. Puoi passare da un percorso all\'altro in base ai tuoi interessi e obiettivi di carriera.' },
          ].map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="bg-black/40 border border-zinc-800 rounded-xl p-5"
            >
              <h3 className="text-sm font-bold text-zinc-200 mb-2">{faq.q}</h3>
              <p className="text-sm text-zinc-400 font-medium leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-linear-to-br from-orange-500/10 to-transparent border border-orange-500/20 p-8 sm:p-10 text-center rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-orange-500/8 blur-[100px] -z-10" />
        <div className="relative z-10 space-y-5">
          <div className="w-14 h-14 mx-auto bg-orange-500/15 text-orange-400 rounded-2xl flex items-center justify-center">
            <Lock size={24} />
          </div>
          <h2 className="text-xl sm:text-2xl font-jakarta font-black text-white tracking-tight">
            Sblocca il percorso {path.title} completo
          </h2>
          <p className="text-zinc-400 font-medium text-base leading-relaxed max-w-lg mx-auto">
            Accedi a tutte le {totalCount} lezioni, progetti e mentoring 1:1 diventando membro di Stackup Room.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="px-8 py-3.5 bg-orange-500 text-white font-bold text-sm hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20 inline-flex items-center gap-2 rounded-xl"
            >
              Entra in Stackup Room <ArrowRight size={16} />
            </Link>
            <Link
              href="/paths"
              className="px-8 py-3.5 bg-black border border-zinc-800 text-zinc-200 font-bold text-sm hover:border-orange-400 hover:text-orange-400 transition-all rounded-xl"
            >
              Altri percorsi
            </Link>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default PathSlugPage;