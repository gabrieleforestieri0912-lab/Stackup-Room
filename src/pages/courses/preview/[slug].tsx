import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import SEO from '../../../components/ui/SEO';
import { motion } from 'framer-motion';
import {
 Play,
 Clock,
 Users,
 CheckCircle2,
 ArrowRight,
 Code,
 Layers,
 ChevronDown,
 Award,
 Zap,
 ShoppingCart,
 Eye,
 FileText,
 RefreshCw,
 Target,
 ListChecks,
 ChevronRight,
 Cpu,
 Globe,
 Database,
 Terminal,
 Paintbrush,
 Code2
} from 'lucide-react';
import COURSES_DATA, { iconMap } from '../../../data/coursesPreviewData';

const CoursePreview = () => {
 const router = useRouter();
 const { slug } = router.query;

 const slugStr = Array.isArray(slug) ? slug[0] : slug;
 if (!slugStr || !COURSES_DATA[slugStr as keyof typeof COURSES_DATA]) {
 return (
 <>
 <SEO title="Corso non trovato" description="Il corso che stai cercando non esiste o non è ancora disponibile." />
 <div className="min-h-screen flex items-center justify-center bg-black">
 <div className="text-center">
 <h1 className="text-3xl font-jakarta font-extrabold text-zinc-100 mb-3">Corso non trovato</h1>
 <p className="text-zinc-400 mb-6">Il corso che stai cercando non esiste o non è ancora disponibile.</p>
  <Link href="/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold hover:bg-orange-600 rounded-xl transition-all">
 <ArrowRight size={18} />
 Torna ai corsi
 </Link>
 </div>
 </div>
 </>
 );
 }

 const course = COURSES_DATA[slugStr as keyof typeof COURSES_DATA];

 return (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5 }}
 className="min-h-screen bg-black"
 >
 <SEO
 title={`${course.title} — Stackup Academy`}
 description={course.shortDesc}
 url={`/courses/preview/${slugStr}`}
 />

 {/* Hero */}
 <section className="bg-black/70 border-b border-zinc-800">
 <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-28 pb-16 lg:pb-20">
 <div className="grid lg:grid-cols-2 gap-12 lg:gap-12 items-center">
 <motion.div
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.6, delay: 0.1 }}
 >
 <div className="flex items-center gap-3 mb-5">
  <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-black uppercase tracking-[0.2em] ">
  {course.tag}
  </span>
  <span className="px-3 py-1 bg-zinc-900 text-zinc-400 text-xs font-black uppercase tracking-[0.2em] rounded-lg">
  {course.level}
  </span>
  </div>

  <h1 className="text-2xl sm:text-3xl lg:text-5xl font-jakarta font-black text-zinc-100 leading-tight tracking-tight mb-5">
  {course.title}
  </h1>

  <p className="text-xl text-zinc-400 font-medium leading-relaxed mb-7">
  {course.shortDesc}
  </p>

  <div className="flex flex-wrap items-center gap-5 mb-8 text-base">
  <div className="flex items-center gap-1.5 text-zinc-400 font-bold">
  <Clock size={18} className="text-orange-500" />
  <span>{course.duration} ore</span>
  </div>
  <div className="flex items-center gap-1.5 text-zinc-400 font-bold">
  <Users size={18} className="text-orange-500" />
  <span>{course.students.toLocaleString()} studenti</span>
  </div>
  </div>
  <div className="flex items-center gap-1.5 text-zinc-400 font-bold">
  <RefreshCw size={16} className="text-zinc-400" />
  <span>Aggiornato: {course.lastUpdated}</span>
  </div>

  <div className="flex items-center gap-3 mb-8">
  <div className="w-12 h-12 bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-base">
  {course.instructor.name.split(' ').map(n => n[0]).join('')}
  </div>
  <div>
  <p className="font-bold text-zinc-100 text-base">{course.instructor.name}</p>
  <p className="text-sm text-zinc-400 font-medium">{course.instructor.role}</p>
  </div>
  </div>

  <div className="flex flex-wrap items-center gap-3">
  <div className="flex items-baseline gap-1 mr-2">
  <span className="text-5xl font-black text-zinc-100">&euro;{course.price}</span>
  <span className="text-base text-zinc-400 font-medium line-through">€{Math.round(course.price * 1.6)}</span>
  </div>
  <Link
  href={`/courses/${slugStr}`}
  className="px-8 py-4 bg-black text-white font-bold text-base hover:bg-orange-600 rounded-xl transition-all flex items-center gap-2 shadow-lg"
  >
  <ShoppingCart size={18} />
  <span>Acquista ora</span>
  </Link>
  <button className="px-8 py-4 border-2 border-zinc-800 text-zinc-300 font-bold text-base hover:border-orange-300 hover:text-orange-400 rounded-xl transition-all flex items-center gap-2">
  <Eye size={18} />
  <span>Anteprima gratuita</span>
  </button>
  </div>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.6, delay: 0.2 }}
 className="relative"
 >
 <div   className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl group cursor-pointer relative">
  <Image
  src={course.imageUrl}
  alt={course.title}
  fill
  className="object-cover group-transition-transform duration-700"
  />
 <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors">
  <div className="w-20 h-20 bg-black/20 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:bg-orange-600 transition-all duration-500 shadow-2xl">
 <Play size={36} className="text-white ml-1" />
 </div>
 </div>
 <div className="absolute bottom-4 left-4 right-4">
  <div className="bg-black/10 backdrop-blur-xl border border-white/20 px-4 py-2.5 rounded-xl flex items-center gap-3">
  <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center shrink-0">
 <Play size={16} className="text-white ml-0.5" />
 </div>
 <div className="text-white text-sm font-bold">Guarda il trailer del corso</div>
 </div>
 </div>
 </div>
 </motion.div>
 </div>
 </div>
 </section>

 {/* Content */}
 <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
 <div className="grid lg:grid-cols-3 gap-12 lg:gap-12">
 <div className="lg:col-span-2 space-y-10">
 <section>
  <h2 className="text-2xl sm:text-3xl font-jakarta font-extrabold text-zinc-100 mb-6 flex items-center gap-3">
  <FileText size={28} className="text-orange-500" />
  Descrizione del Corso
  </h2>
  <div className="space-y-5 text-zinc-400 leading-relaxed text-base">
 {course.longDescription.split('\n\n').map((paragraph, i) => (
 <p key={i}>{paragraph}</p>
 ))}
 </div>
 </section>

 <section>
  <h2 className="text-2xl sm:text-3xl font-jakarta font-extrabold text-zinc-100 mb-6 flex items-center gap-3">
  <Target size={28} className="text-orange-500" />
  Cosa Imparerai
  </h2>
  <div className="grid sm:grid-cols-2 gap-3">
  {course.objectives.map((obj, i) => (
  <div key={i} className="flex items-start gap-3 p-5 bg-black border border-zinc-800 rounded-xl">
  <div className="w-7 h-7 bg-orange-100 flex items-center justify-center text-orange-600 shrink-0 mt-0.5">
  <CheckCircle2 size={16} />
  </div>
  <span className="text-base font-bold text-zinc-300">{obj}</span>
  </div>
  ))}
  </div>
 </section>

 <section>
  <h2 className="text-2xl sm:text-3xl font-jakarta font-extrabold text-zinc-100 mb-6 flex items-center gap-3">
  <Layers size={28} className="text-orange-500" />
  Contenuto del Corso
  </h2>
  <div className="space-y-3">
  {course.modules.map((module, i) => (
  <details
  key={i}
  className="group bg-black border border-zinc-800 rounded-2xl overflow-hidden open:ring-1 open:ring-orange-400/20 open:shadow-sm transition-all"
  >
  <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-black transition-colors">
  <div className="flex items-center gap-4">
  <div className="w-10 h-10 bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-base shrink-0">
  {i + 1}
  </div>
  <div>
  <h3 className="font-bold text-zinc-100 text-lg">{module.title}</h3>
  <p className="text-sm text-zinc-400 font-medium">{module.lessons.length} lezioni &middot; {Math.round(module.duration / 60)} ore</p>
  </div>
  </div>
  <ChevronDown size={20} className="text-zinc-400 group-open:rotate-180 transition-transform shrink-0" />
  </summary>
  <div className="px-6 pb-6 space-y-1.5">
  {module.lessons.map((lesson, j) => (
  <div key={j} className="flex items-center gap-3 px-3 py-2 hover:bg-black transition-colors">
  <Play size={14} className="text-orange-400 shrink-0" />
  <span className="text-base text-zinc-400 font-medium">{lesson}</span>
  </div>
  ))}
  </div>
  </details>
  ))}
 </div>
 </section>
 </div>

 <aside className="lg:col-span-1 space-y-8 lg:sticky lg:top-28 lg:self-start">
  <div className="bg-black border border-zinc-800 p-8 rounded-2xl shadow-sm">
  <h3 className="text-lg font-jakarta font-extrabold text-zinc-100 mb-5 flex items-center gap-2.5">
  <Award size={22} className="text-orange-500" />
  Cosa Include
  </h3>
  <ul className="space-y-3.5">
  {course.includes.map((item, i) => (
  <li key={i} className="flex items-start gap-3">
  <div className="w-6 h-6 bg-orange-100 flex items-center justify-center text-orange-600 shrink-0 mt-0.5">
  <CheckCircle2 size={14} />
  </div>
  <span className="text-base text-zinc-400 font-medium">{item}</span>
  </li>
  ))}
  </ul>
  </div>

  <div className="bg-black border border-zinc-800 p-8 rounded-2xl shadow-sm">
  <h3 className="text-lg font-jakarta font-extrabold text-zinc-100 mb-5 flex items-center gap-2.5">
  <ListChecks size={22} className="text-orange-500" />
  Requisiti Minimi
  </h3>
  <ul className="space-y-3">
  {course.requirements.map((req, i) => (
  <li key={i} className="flex items-start gap-3">
  <div className="w-6 h-6 bg-amber-900/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
  <Zap size={14} />
  </div>
  <span className="text-base text-zinc-400 font-medium">{req}</span>
  </li>
  ))}
  </ul>
  </div>

  <div className="bg-black border border-zinc-800 p-8 rounded-2xl shadow-sm">
  <h3 className="text-lg font-jakarta font-extrabold text-zinc-100 mb-5 flex items-center gap-2.5">
  <Code size={22} className="text-orange-500" />
  Competenze Acquisite
  </h3>
  <div className="flex flex-wrap gap-2">
  {course.skills.map((skill, i) => (
  <span key={i} className="px-3 py-1.5 bg-zinc-900 text-zinc-300 text-xs font-bold border border-zinc-800/60 rounded-lg">
  {skill}
  </span>
  ))}
  </div>
  </div>

  <div className="bg-black p-8 rounded-2xl shadow-xl text-center">
  <p className="text-4xl font-black text-white mb-1">&euro;{course.price}</p>
   <p className="text-sm text-zinc-400 font-medium mb-5">Accesso continuativo &middot; Aggiornamenti inclusi</p>
  <Link
  href={`/courses/${slugStr}`}
  className="block w-full py-4 bg-orange-600 text-white font-bold text-base hover:bg-orange-700 rounded-xl transition-all shadow-lg shadow-orange-600/20 mb-3"
  >
  Acquista ora
  </Link>
  <button className="w-full py-4 border border-white/10 text-white font-bold text-base hover:bg-black/10 rounded-xl transition-all">
  Prova l&apos;anteprima gratuita
  </button>
 </div>
 </aside>
 </div>
 </div>
 </motion.div>
 );
};

export default CoursePreview;

