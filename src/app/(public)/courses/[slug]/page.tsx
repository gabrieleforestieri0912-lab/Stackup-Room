'use client';

/* eslint-disable react-hooks/exhaustive-deps */
import React, { Suspense, useState, useEffect, useRef } from'react';
import Image from'next/image';
import { useParams, useSearchParams } from'next/navigation';
import SectionTitle from'@/components/ui/SectionTitle';
import Card from'@/components/ui/Card';
import ExerciseComponent from'@/components/course/ExerciseComponent';
import { motion } from'framer-motion';
import { useAuth } from'@/context/AuthContext';
import { getAccessToken } from'@/lib/auth-token';
import toast from'react-hot-toast';
import {
 Play,
 CheckCircle2,
 Clock,
 Code,
 BookOpen,
 ChevronRight,
 ChevronDown,
 Trophy,
 Users,
 Lock,
 Target,
 Flag,
 AlertTriangle,
 ExternalLink,
 GraduationCap
} from'lucide-react';

interface Instructor {
 name: string;
 bio: string;
 avatar: string;
}

interface TestCase {
 input: string;
 expectedOutput: string;
 description: string;
}

interface Hint {
 content: string;
 order: number;
}

interface CommonError {
 error: string;
 fix: string;
}

interface Exercise {
 _id?: string;
 title: string;
 type: string;
 difficulty: string;
 points: number;
 description: string;
 why?: string;
 how?: string;
 instructions: string;
 commonErrors?: CommonError[];
 checkpoint?: string;
 isCheckpoint?: boolean;
 completed?: boolean;
 starterCode: string;
 solution: string;
 testCases: TestCase[];
 hints: Hint[];
}

interface RelatedCourse {
 id: string;
 title: string;
 slug: string;
}

interface Section {
 title: string;
 description: string;
 content: string;
 duration: number;
 objective?: string;
 checkpointTitle?: string;
 checkpointDescription?: string;
 unlocked?: boolean;
 checkpointPassed?: boolean;
 hasCheckpoint?: boolean;
 starterRepoUrl?: string;
 solutionRepoUrl?: string;
 cheatSheet?: string;
 docsLinks?: { label: string; url: string }[];
 aiPrompt?: string;
 troubleshooting?: { error: string; fix: string }[];
 exercises: Exercise[];
}

interface MockCourse {
 _id: string;
 slug: string;
 title: string;
 description: string;
 longDescription: string;
 subtitle?: string;
 outcome?: string;
 lessonDuration?: number;
 stackVersion?: string;
 prerequisiteCheck?: string;
 prerequisiteCourse?: RelatedCourse | null;
 nextCourse?: RelatedCourse | null;
 price: number;
 level: string;
 duration: number;
 imageUrl?: string;
 prerequisites?: string[];
 learningObjectives?: string[];
 instructor?: Instructor;
  reviewCount: number;
 enrollmentCount: number;
 sections: Section[];
}

const CourseDetailPage = () => {
 const params = useParams();
 const searchParams = useSearchParams();
 const slug = params?.slug as string;
 const success = searchParams?.get('success');
 const canceled = searchParams?.get('canceled');
 const { user, refreshUser } = useAuth();
 const [course, setCourse] = useState<MockCourse | null>(null);
 const [activeSection, setActiveSection] = useState(0);
 const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
 const [loading, setLoading] = useState(true);
 const [purchaseLoading, setPurchaseLoading] = useState(false);
 const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
 const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  const isEnrolled = course?._id ? user?.enrolledCourses?.includes(course._id) : false;
  const freeAccess = Number(course?.price ?? -1) === 0;
  const autoEnrollRef = useRef(false);

  useEffect(() => {
  if (slug) {
  fetchCourse();
  }
  }, [slug]);

  // I corsi gratuiti si iscrive automaticamente l'utente loggato: senza
  // enrollment il contenuto, i progressi e i certificati restano bloccati.
  useEffect(() => {
  if (!course || autoEnrollRef.current) return;
  if (!freeAccess || !user || isEnrolled) return;
  autoEnrollRef.current = true;
  (async () => {
  try {
  const token = await getAccessToken();
  if (!token) return;
  const res = await fetch(`/api/courses/${course.slug}/enroll`, {
   method: 'POST',
   headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) {
   await refreshUser();
   fetchCourse();
  }
  } catch {
  // silenzioso: l'utente può iscriversi dal pulsante "Inizia gratis"
  }
  })();
  }, [course, freeAccess, user, isEnrolled, refreshUser]);

 useEffect(() => {
 if (success ==='true') {
 refreshUser();
 toast.success('Pagamento completato! Benvenuto nel corso.', {
 duration: 5000,
 icon:'🎉'
 });
 }
 if (canceled ==='true') {
 toast.error('Pagamento annullato.');
 }
 }, [success, canceled, refreshUser]);



 const handlePurchase = async () => {
 if (!user) {
 toast.error('Devi effettuare il login per acquistare un corso');
 return;
 }

 setPurchaseLoading(true);
 try {
 const token = await getAccessToken();
 if (!token) {
   toast.error('Sessione scaduta. Effettua di nuovo il login.');
   return;
 }
 const response = await fetch('/api/payments/create-checkout', {
 method:'POST',
 headers: {'Content-Type':'application/json','Authorization':`Bearer ${token}`
 },
 body: JSON.stringify({ courseId: course!._id }),
 });

 const data = await response.json();
 if (!response.ok) throw new Error(data.message);

 if (data.url) {
 window.location.href = data.url;
 }
 } catch (error) {
 toast.error(error instanceof Error ? error.message :'Errore');
 } finally {
 setPurchaseLoading(false);
 }
 };

  const handleEnrollFree = async () => {
  if (!course) return;
  if (!user) {
  toast.error('Accedi per iniziare il corso');
  return;
  }
  try {
  const token = await getAccessToken();
  if (!token) {
  toast.error('Sessione scaduta. Effettua di nuovo il login.');
  return;
  }
  const res = await fetch(`/api/courses/${course.slug}/enroll`, {
   method: 'POST',
   headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Errore iscrizione');
  await refreshUser();
  fetchCourse();
  toast.success('Iscrizione completata! Inizia il corso. 🚀');
  } catch (error) {
  toast.error(error instanceof Error ? error.message : 'Errore');
  }
  };

  const fetchCourse = async () => {
 try {
 const token = await getAccessToken();
 const response = await fetch(`/api/courses/${slug}`, {
  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
 });
 if (!response.ok) {
 throw new Error('Course not found');
 }
 const data = await response.json();
 if (data.success && data.data) {
 setCourse(data.data);
 if (Array.isArray(data.data.completedExerciseIds)) {
  setCompletedExercises(new Set(data.data.completedExerciseIds));
 }
 } else {
 throw new Error('Course not found');
 }
 } catch (error) {
 console.error('Failed to fetch course:', error);
 } finally {
 setLoading(false);
 }
 };


 const toggleSection = (index: number) => {
 const section = course?.sections[index];
 if (course && section && isEnrolled && section.unlocked === false) {
  toast.error('Completa il checkpoint del modulo precedente per sbloccare questo modulo.');
  return;
 }
 const newExpanded = new Set(expandedSections);
 if (newExpanded.has(index)) {
 newExpanded.delete(index);
 } else {
 newExpanded.add(index);
 }
 setExpandedSections(newExpanded);
 setActiveSection(index);
 };

 const openExercise = (exercise: Exercise) => {
 setSelectedExercise(exercise);
 };

 const closeExercise = () => {
 setSelectedExercise(null);
 };

 const completeExercise = async (exerciseId: string, _code: string) => {
 setCompletedExercises(prev => new Set([...prev, exerciseId]));
 setSelectedExercise(null);
 // Salva il completamento sul backend: XP + streak
 try {
  const token = await getAccessToken();
  if (!token || !course) return;
  const res = await fetch('/api/progress/exercises', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
   body: JSON.stringify({ exerciseId, courseId: course._id }),
  });
  const data = await res.json();
  if (res.ok) {
   if (data.certificateGranted) {
    toast.success('Certificato ottenuto! 🎓', { duration: 6000 });
   } else if (data.checkpointCompleted) {
    toast.success('Checkpoint superato! Modulo successivo sbloccato. 🚀', { duration: 5000 });
    fetchCourse(); // ricarica il gating dei moduli
   } else if (data.awarded && data.points > 0) {
    toast.success(`+${data.points} XP!`);
   }
   refreshUser();
  }
 } catch (error) {
  console.error('Failed to save progress:', error);
 }
 };

  if (loading) {
  return (
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-20">
    <section className="mb-6">
    <div className="grid lg:grid-cols-2 gap-12 items-center">
    <div className="space-y-6">
    <div className="flex items-center gap-4">
    <div className="h-8 w-24 skeleton" />
    <div className="h-6 w-40 skeleton" />
    </div>
    <div className="h-12 w-3/4 skeleton" />
    <div className="h-6 w-full skeleton" />
    <div className="h-6 w-5/6 skeleton" />
    <div className="h-6 w-4/5 skeleton" />
    <div className="h-12 w-56 skeleton" />
    </div>
    <div className="aspect-video skeleton-card" />
    </div>
    </section>
    <div className="text-center text-zinc-500 mt-4">
    <p className="text-sm font-medium">Caricamento corso...</p>
    </div>
    </div>
   );
   }

  if (!course) {
  return (
  <div className="max-w-7xl mx-auto px-6 pt-28 pb-20 text-center">
  <h2 className="text-2xl font-bold text-zinc-300">Corso non trovato</h2>
  <p className="text-zinc-400 mt-2">Il corso che cerchi non esiste o non è disponibile.</p>
  </div>
  );
  }

  return (
  <div className="max-w-7xl mx-auto px-6 pt-28 pb-20">

 {/* Course Header */}
 <section className="mb-6">
 <div className="grid lg:grid-cols-2 gap-12 items-center">
 <div>
  <div className="flex items-center gap-4 mb-6">
   <span className="px-3 py-1 bg-orange-100 text-orange-600 text-sm font-bold uppercase tracking-wider">
   {course.level}
   </span>
   {course.stackVersion && (
   <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-bold rounded-lg">
   {course.stackVersion}
   </span>
   )}
   </div>

  <h1 className="max-w-5xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-7xl mb-6">
  {course.title}
  </h1>

  {course.subtitle && (
  <p className="text-2xl text-orange-300 font-bold leading-snug mb-4">
  {course.subtitle}
  </p>
  )}

  <p className="text-xl text-zinc-400 font-medium leading-relaxed mb-8">
  {course.longDescription}
  </p>

  {course.outcome && (
  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 mb-8">
  <div className="flex items-center gap-2 mb-2">
  <Target size={18} className="text-orange-400" />
  <span className="text-xs font-black text-orange-300 uppercase tracking-widest">Cosa saprai fare alla fine</span>
  </div>
  <p className="text-zinc-200 font-medium leading-relaxed">{course.outcome}</p>
  </div>
  )}

  <div className="flex flex-wrap gap-6 mb-8 text-base">
  <div className="flex items-center gap-2">
  <Clock size={22} className="text-zinc-400" />
  <span className="font-bold text-zinc-300">{course.duration} ore totali</span>
  </div>
  {course.lessonDuration && (
  <div className="flex items-center gap-2">
  <BookOpen size={22} className="text-zinc-400" />
  <span className="font-bold text-zinc-300">~{course.lessonDuration} min a lezione</span>
  </div>
  )}
  <div className="flex items-center gap-2">
  <Users size={22} className="text-zinc-400" />
  <span className="font-bold text-zinc-300">{course.enrollmentCount.toLocaleString()} studenti</span>
  </div>
  <div className="flex items-center gap-2">
  <Trophy size={22} className="text-zinc-400" />
  <span className="font-bold text-zinc-300">Certificato incluso</span>
  </div>
  </div>

  {course.prerequisites && course.prerequisites.length > 0 && (
  <div className="mb-8">
  <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Prerequisiti</span>
  <ul className="mt-2 space-y-1">
  {course.prerequisites.map((p, i) => (
  <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
  <CheckCircle2 size={15} className="text-zinc-600 shrink-0 mt-0.5" />
  <span>{p}</span>
  </li>
  ))}
  </ul>
  {course.prerequisiteCheck && (
  <p className="mt-3 px-4 py-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-sm text-orange-300 font-medium">
  Filtro: {course.prerequisiteCheck}
  </p>
  )}
  </div>
  )}

  {(course.prerequisiteCourse || course.nextCourse) && (
  <div className="flex flex-col sm:flex-row gap-3 mb-8">
  {course.prerequisiteCourse && (
  <a
  href={`/courses/${course.prerequisiteCourse.slug}`}
  className="px-4 py-2.5 bg-black border border-zinc-800 text-zinc-300 text-sm font-bold hover:border-zinc-600 transition-colors rounded-xl inline-flex items-center gap-2"
  >
  <GraduationCap size={15} />
  Propedeutico: {course.prerequisiteCourse.title}
  </a>
  )}
  {course.nextCourse && (
  <a
  href={`/courses/${course.nextCourse.slug}`}
  className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm font-bold hover:border-orange-400 hover:text-orange-300 transition-colors rounded-xl inline-flex items-center gap-2"
  >
  <ExternalLink size={15} />
  Dopo questo: {course.nextCourse.title}
  </a>
  )}
  </div>
  )}

  {course.instructor && (
  <div className="flex items-center gap-4 mb-8">
  <Image
  src={course.instructor.avatar ||'/avatar-default.jpg'}
  alt={course.instructor.name || 'Instructor'}
  width={56}
  height={56}
  className="w-14 h-14 object-cover"
  />
  <div>
  <p className="font-bold text-zinc-100 text-lg">{course.instructor.name}</p>
  <p className="text-base text-zinc-400">{course.instructor.bio}</p>
  </div>
  </div>
  )}

  <div className="flex gap-4">
  {isEnrolled ? (
  <button 
  onClick={() => setExpandedSections(new Set([...Array(course.sections.length).keys()]))}
  className="px-8 py-4 bg-orange-600 text-white font-bold text-base hover:bg-orange-700 transition-colors flex items-center gap-2"
  >
  <Play size={20} />
  <span>Continua il corso</span>
  </button>
  ) : freeAccess ? (
  <button 
  onClick={handleEnrollFree}
  className="px-8 py-4 bg-orange-600 text-white font-bold text-base hover:bg-orange-700 transition-colors flex items-center gap-2"
  >
  <Play size={20} />
  <span>Inizia gratis</span>
  </button>
  ) : (
  <button 
  onClick={handlePurchase}
  disabled={purchaseLoading}
  className="px-8 py-4 bg-black text-white font-bold text-base hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-50"
  >
  <Lock size={20} />
  <span>{purchaseLoading ?'Elaborazione...' :`Acquista ora a €${course.price}`}</span>
  </button>
  )}
  {!isEnrolled && !freeAccess && (
  <button className="px-8 py-4 border-2 border-zinc-800 text-zinc-300 font-bold text-base hover:border-orange-300 hover:text-orange-600 transition-colors">
  Anteprima gratuita
  </button>
  )}
  </div>
 </div>

 <div className="relative">
 <div className="aspect-video bg-black overflow-hidden shadow-xl relative">
 {course.imageUrl ? (
 <Image
 src={course.imageUrl}
 alt={course.title}
 fill
 className="object-cover"
 />
 ) : (
 <div className="absolute inset-0 bg-linear-to-br from-zinc-900 via-black to-zinc-950" />
 )}
 <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
 <button className="w-20 h-20 bg-black/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/30 transition-colors">
 <Play size={32} className="text-white ml-1" />
 </button>
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* Course Content */}
 <div className="grid lg:grid-cols-3 gap-12">
 {/* Sections Sidebar */}
 <div className="lg:col-span-1">
 <Card className="p-6">
 <h3 className="text-xl font-bold text-zinc-100 mb-6">Contenuto del corso</h3>
 <div className="space-y-2">
 {course.sections.map((section, index) => {
  const isLocked = isEnrolled && section.unlocked === false;
  const canOpen = isEnrolled && !isLocked;
  return (
 <div key={index} className={`border ${isLocked ? 'border-zinc-800/60 opacity-70' : 'border-zinc-800'}`}>
 <button
 onClick={() => toggleSection(index)}
 className="w-full flex items-center justify-between p-4 text-left hover:bg-black transition-colors"
 >
 <div className="flex items-center gap-3">
 <div className={`w-8 h-8 flex items-center justify-center text-sm font-bold ${isLocked ? 'bg-zinc-900 text-zinc-500' : 'bg-black text-zinc-300'}`}>
 {isLocked ? <Lock size={14} /> : index + 1}
 </div>
 <div>
 <h4 className="font-bold text-zinc-100">{section.title}</h4>
 <p className="text-sm text-zinc-400">{section.duration} min{section.hasCheckpoint ? ' · Checkpoint finale' : ''}</p>
 </div>
 </div>
 {isLocked ? (
 <Lock size={16} className="text-zinc-600" />
 ) : expandedSections.has(index) ? (
 <ChevronDown size={20} className="text-zinc-400" />
 ) : (
 <ChevronRight size={20} className="text-zinc-400" />
 )}
 </button>

 {isLocked && (
 <div className="px-4 pb-4">
 <p className="text-xs text-zinc-500 font-medium leading-relaxed">
 Bloccato: completa il checkpoint del modulo precedente per sbloccarlo.
 </p>
 </div>
 )}

 {!isLocked && expandedSections.has(index) && (
 <div className="px-4 pb-4 space-y-2">
 {section.objective && (
 <div className="flex items-start gap-2 p-2.5 bg-zinc-900/60 rounded-lg">
 <Target size={14} className="text-orange-400 shrink-0 mt-0.5" />
 <p className="text-xs text-zinc-400 leading-relaxed">{section.objective}</p>
 </div>
 )}
 {section.exercises.map((exercise, exIndex) => (   <div
   key={exIndex}
   onClick={() => canOpen && openExercise(exercise)}
   className={`flex items-center gap-3 p-2 rounded ${canOpen ? 'hover:bg-black cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
   >
   {exercise.isCheckpoint ? <Flag size={16} className="text-orange-400" /> : <Code size={16} className="text-zinc-400" />}
   <span className="text-sm font-medium text-zinc-300">{exercise.title}</span>
   {canOpen && (exercise.completed || completedExercises.has(exercise._id || exercise.title)) && (
   <CheckCircle2 size={16} className="text-green-500 ml-auto" />
   )}
   {!canOpen && <Lock size={12} className="text-zinc-500 ml-auto" />}
   </div>
 ))}
 {section.checkpointTitle && (
 <div className="mt-2 p-2.5 border border-orange-500/30 bg-orange-500/5 rounded-lg">
 <div className="flex items-center gap-2 mb-1">
 <Flag size={14} className="text-orange-400" />
 <span className="text-xs font-black text-orange-300 uppercase tracking-wider">Checkpoint del modulo</span>
 </div>
 <p className="text-xs text-zinc-400 font-medium">{section.checkpointTitle}</p>
 {section.checkpointPassed && (
 <p className="text-xs text-green-400 font-bold mt-1 flex items-center gap-1">
 <CheckCircle2 size={12} /> Superato
 </p>
 )}
 </div>
 )}
 </div>
 )}
 </div>
 );
 })}
 </div>
 </Card>
 </div>

 {/* Main Content */}
 <div className="lg:col-span-2">
 <Card className="p-8">
 {course.sections[activeSection] && (() => {
  const section = course.sections[activeSection];
  const sectionLocked = isEnrolled && section.unlocked === false;
  return (
 <div>
 <div className="flex items-center gap-3 mb-6">
 <div className="w-10 h-10 bg-orange-100 flex items-center justify-center">
 <BookOpen size={20} className="text-orange-600" />
 </div>
 <div>
 <h2 className="text-2xl font-bold text-zinc-100">
 {section.title}
 </h2>
 <p className="text-zinc-400">{section.description}</p>
 </div>
 {section.hasCheckpoint && (
 <span className="ml-auto px-2.5 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-300 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1 shrink-0">
 <Flag size={11} /> Checkpoint
 </span>
 )}
 </div>

 {section.objective && !sectionLocked && (
 <div className="flex items-start gap-2 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl mb-6">
 <Target size={16} className="text-orange-400 shrink-0 mt-0.5" />
 <p className="text-sm text-zinc-300 leading-relaxed"><span className="font-black text-zinc-200">Obiettivo del modulo: </span>{section.objective}</p>
 </div>
 )}

   <div className="prose prose-slate max-w-none mb-8">
   {!isEnrolled ? (
   <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 text-center">
   <Lock size={20} className="text-zinc-500 mx-auto mb-2" />
   <p className="text-sm text-zinc-400 font-medium">
   {freeAccess ? 'Accedi per iniziare questo corso gratuito.' : 'Il contenuto della lezione è riservato ai membri. Acquista il corso per sbloccarlo.'}
   </p>
   </div>
   ) : sectionLocked ? (
   <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 text-center">
   <Lock size={20} className="text-orange-400 mx-auto mb-2" />
   <p className="text-sm text-zinc-300 font-bold mb-1">Modulo bloccato</p>
   <p className="text-sm text-zinc-400 font-medium">
   Completa il checkpoint del modulo precedente per sbloccare questo modulo.
   </p>
   </div>
   ) : (
   <p className="text-zinc-300 leading-relaxed whitespace-pre-line">
   {section.content}
   </p>
   )}
   </div>

 {/* Materiali di supporto del modulo */}
 {!sectionLocked && isEnrolled && (
 <div className="space-y-3 mb-8">
  {(section.starterRepoUrl || section.solutionRepoUrl) && (
   <div className="flex flex-wrap gap-3">
    {section.starterRepoUrl && (
     <a href={section.starterRepoUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 bg-black border border-zinc-800 text-zinc-200 text-sm font-bold hover:border-orange-400 hover:text-orange-300 transition-colors rounded-xl inline-flex items-center gap-2">
      <Code size={15} /> Repo starter
     </a>
    )}
    {section.solutionRepoUrl && (
     <a href={section.solutionRepoUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 bg-black border border-zinc-800 text-zinc-200 text-sm font-bold hover:border-orange-400 hover:text-orange-300 transition-colors rounded-xl inline-flex items-center gap-2">
      <ExternalLink size={15} /> Repo soluzione
     </a>
    )}
   </div>
  )}
  {section.cheatSheet && (
   <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
    <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Cheat sheet</span>
    <pre className="mt-2 text-sm text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">{section.cheatSheet}</pre>
   </div>
  )}
  {section.docsLinks && section.docsLinks.length > 0 && (
   <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
    <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Documentazione</span>
    <div className="mt-2 flex flex-wrap gap-2">
     {section.docsLinks.map((doc, i) => (
      <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-400 hover:text-orange-300 font-medium inline-flex items-center gap-1">
       <ExternalLink size={13} /> {doc.label}
      </a>
     ))}
    </div>
   </div>
  )}
  {section.aiPrompt && (
   <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
    <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">AI coding agent — prompt suggerito</span>
    <p className="mt-2 text-sm text-zinc-400 leading-relaxed italic">{section.aiPrompt}</p>
   </div>
  )}
  {section.troubleshooting && section.troubleshooting.length > 0 && (
   <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
    <div className="flex items-center gap-2 mb-2">
     <AlertTriangle size={15} className="text-amber-400" />
     <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Se qualcosa non funziona</span>
    </div>
    <div className="space-y-2">
     {section.troubleshooting.map((item, i) => (
      <div key={i} className="text-sm">
       <p className="text-zinc-300 font-bold">{item.error}</p>
       <p className="text-zinc-400">{item.fix}</p>
      </div>
     ))}
    </div>
   </div>
  )}
 </div>
 )}

 {/* Exercises */}
 {section.exercises.length > 0 && (
 <div className="space-y-6">   <h3 className="text-xl font-bold text-zinc-100">Esercizi</h3>
   {!isEnrolled ? (
   <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 text-center">
   <Lock size={20} className="text-zinc-500 mx-auto mb-2" />
   <p className="text-sm text-zinc-400 font-medium">
   {freeAccess ? 'Accedi per sbloccare gli esercizi del corso.' : 'Gli esercizi sono riservati ai membri. Acquista il corso per sbloccarli.'}
   </p>
   </div>
   ) : sectionLocked ? (
   <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 text-center">
   <Lock size={20} className="text-orange-400 mx-auto mb-2" />
   <p className="text-sm text-zinc-400 font-medium">
   Gli esercizi di questo modulo si sbloccano dopo il checkpoint precedente.
   </p>
   </div>
   ) : (
   section.exercises.map((exercise, index) => (
 <Card key={index} className={`p-6 border-l-4 ${exercise.isCheckpoint ? 'border-l-orange-500' : 'border-l-zinc-700'}`}>
 <div className="flex items-start justify-between mb-4">
 <div>
 <div className="flex items-center gap-2 mb-2">
 <h4 className="text-lg font-bold text-zinc-100">{exercise.title}</h4>
 {exercise.isCheckpoint && (
  <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/30 text-orange-300 text-[10px] font-black uppercase tracking-widest rounded-md flex items-center gap-1">
   <Flag size={10} /> Checkpoint
  </span>
 )}
 </div>
 <p className="text-zinc-400 mb-3">{exercise.description}</p>
 </div>
 <div className="flex items-center gap-2">
 <span className={`px-2 py-1 text-xs font-bold ${
 exercise.difficulty ==='easy' ?'bg-green-100 text-green-600' :
 exercise.difficulty ==='medium' ?'bg-yellow-100 text-yellow-600' :'bg-red-100 text-red-600'
 }`}>
 {exercise.difficulty}
 </span>
 <span className="text-sm font-bold text-zinc-400">{exercise.points} pts</span>
 </div>
 </div>

 {exercise.why && (
 <div className="mb-3">
  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Perché</span>
  <p className="text-sm text-zinc-400 leading-relaxed">{exercise.why}</p>
 </div>
 )}

 <div className="bg-black p-4 mb-4">
 <p className="text-sm text-zinc-300 whitespace-pre-line">{exercise.instructions}</p>
 </div>

 {exercise.checkpoint && (
 <div className="flex items-start gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl mb-4">
 <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
 <p className="text-sm text-zinc-300"><span className="font-black text-emerald-300">Come capire se è giusto: </span>{exercise.checkpoint}</p>
 </div>
 )}

 <button
 onClick={() => openExercise(exercise)}
 className="px-6 py-3 bg-orange-600 text-white font-bold hover:bg-orange-700 transition-colors"
 >
 Risolvi esercizio
 </button>   </Card>
   ))
   )}
   </div>
   )}
 </div>
 );
 })()}
 </Card>
 </div>
 </div>

 {/* Exercise Modal */}
 {selectedExercise && (
 <ExerciseComponent
 exercise={selectedExercise}
 onComplete={completeExercise}
 onClose={closeExercise}
 />
 )}
 </div>
 );
};

const CourseDetail: React.FC = () => (
  <Suspense fallback={
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-20">
      <div className="text-center text-zinc-500 mt-4">
        <p className="text-sm font-medium">Caricamento corso...</p>
      </div>
    </div>
  }>
    <CourseDetailPage />
  </Suspense>
);

export default CourseDetail;

