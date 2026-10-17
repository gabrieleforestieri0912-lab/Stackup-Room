import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface NewCourse {
  title: string;
  slug: string;
  description: string;
  long_description: string;
  subtitle: string;
  outcome: string;
  lesson_duration: number;
  stack_version: string;
  prerequisite_check: string;
  category: string;
  level: string;
  duration: number;
  price: number;
  icon: string;
  image_url: string;
  tags: string[];
  prerequisites: string[];
  learning_objectives: string[];
  instructor_name: string;
  instructor_bio: string;
  instructor_avatar: string;
  is_published: boolean;
  prerequisite_course_slug?: string;
  next_course_slug?: string;
}

const newCourses: NewCourse[] = [
  {
    title: 'Landing Page Design',
    slug: 'landing-page-design',
    description: 'Design e sviluppo di landing page ad alta conversione con Next.js e Tailwind.',
    long_description: 'La landing page è il front-end del tuo business. Una landing page ben progettata può triplicare il tasso di conversione. In questo corso imparerai a progettare e sviluppare landing page professionali con Next.js e Tailwind CSS.',
    subtitle: 'Impara a progettare e sviluppare landing page che convertono, da zero a deploy su Vercel.',
    outcome: 'Avrai deployato una landing page professionale, responsive e ottimizzata per la conversione, pronta per il tuo portfolio.',
    lesson_duration: 15,
    stack_version: 'Next.js 15 (App Router) + Tailwind CSS 4',
    prerequisite_check: 'Sai già scrivere una pagina HTML con CSS? Se no, inizia da HTML Strutturale e CSS Moderno.',
    category: 'Frontend',
    level: 'Beginner',
    duration: 20,
    price: 49,
    icon: 'Paintbrush',
    image_url: '/corsi/landing.png',
    tags: ['design', 'landing-page', 'next.js', 'tailwind'],
    prerequisites: ['Conoscenza base di HTML e CSS'],
    next_course_slug: 'nextjs-saas',
    learning_objectives: [
      'Progettare layout efficaci per la conversione',
      'Sviluppare landing page con Next.js e Tailwind',
      'Implementare animazioni e interazioni fluide',
      'Ottimizzare per SEO e performance',
    ],
    instructor_name: 'Gabriele Forestieri',
    instructor_bio: 'Fullstack Developer & Founder',
    instructor_avatar: '',
    is_published: true,
  },
  {
    title: 'Next.js SaaS Starter',
    slug: 'nextjs-saas',
    description: 'Costruisci una web app SaaS completa: auth, pagamenti, dashboard e deploy.',
    long_description: 'Il modello SaaS è il modo più diffuso per monetizzare applicazioni web. In questo corso costruirai una web app SaaS completa in Next.js con autenticazione, pagamenti Stripe e deploy in produzione.',
    subtitle: 'Da zero a SaaS in produzione: auth, pagamenti Stripe e dashboard con Next.js.',
    outcome: 'Avrai una web app SaaS funzionante e deployata, con autenticazione, pagamenti ricorrenti e dashboard admin.',
    lesson_duration: 20,
    stack_version: 'Next.js 15 (App Router) + Stripe + Supabase',
    prerequisite_check: 'Sai già creare componenti React con props e state? Se no, inizia da React & Modern Frontend.',
    category: 'Frontend',
    level: 'Intermedio',
    duration: 25,
    price: 99,
    icon: 'Globe',
    image_url: '/corsi/next-saas.png',
    tags: ['saas', 'next.js', 'stripe', 'fullstack'],
    prerequisites: ['Conoscenza solida di React e Next.js', 'Esperienza base con TypeScript'],
    prerequisite_course_slug: 'landing-page-design',
    learning_objectives: [
      'Architettare una SaaS con Next.js App Router',
      'Implementare autenticazione multi-provider',
      'Integrare pagamenti ricorrenti con Stripe',
      'Deployare in produzione con monitoring',
    ],
    instructor_name: 'Gabriele Forestieri',
    instructor_bio: 'Fullstack Developer & Founder',
    instructor_avatar: '',
    is_published: true,
  },
  {
    title: 'Go Backend',
    slug: 'go-backend',
    description: 'Backend performanti con Go: API REST, concorrenza, database e microservizi.',
    long_description: 'Go è il linguaggio scelto dalle aziende per costruire infrastrutture scalabili. Imparerai Go da zero fino a microservizi distribuiti con goroutine, channel e API REST.',
    subtitle: 'Costruisci API REST performanti in Go, con concorrenza e microservizi pronti per la produzione.',
    outcome: 'Avrai deployato una API REST in Go con autenticazione, database e test, pronta per il portfolio.',
    lesson_duration: 20,
    stack_version: 'Go 1.24 + PostgreSQL + Docker',
    prerequisite_check: 'Sai già programmare in almeno un linguaggio? Se no, inizia da JavaScript Pro.',
    category: 'Backend',
    level: 'Intermedio',
    duration: 30,
    price: 99,
    icon: 'Terminal',
    image_url: '/corsi/go.png',
    tags: ['go', 'backend', 'api-rest', 'microservizi'],
    prerequisites: ['Esperienza con almeno un linguaggio di programmazione'],
    next_course_slug: 'docker-devops',
    learning_objectives: [
      'Padroneggiare sintassi e tipi di Go',
      'Scrivere codice concorrente con goroutine e channel',
      'Costruire API REST complete',
      'Deployare microservizi con Docker',
    ],
    instructor_name: 'Gabriele Forestieri',
    instructor_bio: 'Fullstack Developer & Founder',
    instructor_avatar: '',
    is_published: true,
  },
  {
    title: 'Docker & DevOps',
    slug: 'docker-devops',
    description: 'Containerizzazione, CI/CD e orchestrazione per ambienti di produzione moderni.',
    long_description: 'Docker ha rivoluzionato il deploy software. Imparerai a containerizzare applicazioni, automatizzare deploy con CI/CD e gestire infrastrutture moderne.',
    subtitle: 'Containerizza qualsiasi app e automatizza il deploy con CI/CD e Kubernetes.',
    outcome: 'Avrai containerizzato un\'app reale e configurato una pipeline CI/CD completa con deploy automatico.',
    lesson_duration: 15,
    stack_version: 'Docker 28 + GitHub Actions + Kubernetes',
    prerequisite_check: 'Sai usare il terminale e un linguaggio di programmazione? Se no, inizia da Go Backend o SQL & Database.',
    category: 'Backend',
    level: 'Intermedio',
    duration: 20,
    price: 79,
    icon: 'Cpu',
    image_url: '/corsi/docker.png',
    tags: ['docker', 'devops', 'ci-cd', 'kubernetes'],
    prerequisites: ['Esperienza con terminale Linux', 'Conoscenza base di un linguaggio di programmazione'],
    prerequisite_course_slug: 'go-backend',
    learning_objectives: [
      'Padroneggiare Docker: immagini, container e networking',
      'Configurare pipeline CI/CD con GitHub Actions',
      'Orchestrare container con Kubernetes',
      'Implementare monitoring e logging',
    ],
    instructor_name: 'Gabriele Forestieri',
    instructor_bio: 'Fullstack Developer & Founder',
    instructor_avatar: '',
    is_published: true,
  },
  {
    title: 'SQL & Database Design',
    slug: 'sql-database',
    description: 'Progetta database relazionali solidi: modellazione, query, indici e performance.',
    long_description: 'I database relazionali sono il cuore delle applicazioni moderne. Imparerai modellazione, SQL avanzato, ottimizzazione performance e progettazione per applicazioni reali.',
    subtitle: 'Progetta database relazionali solidi: modellazione, query complesse e performance.',
    outcome: 'Avrai progettato e ottimizzato il database di un\'app reale, con schema normalizzato e query performanti.',
    lesson_duration: 15,
    stack_version: 'PostgreSQL 17',
    prerequisite_check: 'Nessuna esperienza con database richiesta, ma sapere programmare aiuta.',
    category: 'Backend',
    level: 'Beginner',
    duration: 25,
    price: 49,
    icon: 'Database',
    image_url: '/corsi/sql.png',
    tags: ['sql', 'database', 'postgresql', 'data-modeling'],
    prerequisites: ['Nessuna esperienza con database richiesta'],
    next_course_slug: 'go-backend',
    learning_objectives: [
      'Progettare schemi di database normalizzati',
      'Scrivere query SQL complesse',
      'Ottimizzare performance con indici',
      'Gestire migrazioni e versioning',
    ],
    instructor_name: 'Gabriele Forestieri',
    instructor_bio: 'Fullstack Developer & Founder',
    instructor_avatar: '',
    is_published: true,
  },
  {
    title: 'Git & GitHub',
    slug: 'git-github',
    description: 'Controllo versione e collaborazione professionale con Git e GitHub.',
    long_description: 'Git è lo strumento più importante per la collaborazione nel software development. Corso gratuito da zero a hero: commit, branch, merge, PR, code review e GitHub Actions.',
    subtitle: 'Da zero a hero: commit, branch, pull request e GitHub Actions.',
    outcome: 'Gestirai un repository reale con branch, PR e una pipeline CI/CD configurata con GitHub Actions.',
    lesson_duration: 10,
    stack_version: 'Git 2.4x + GitHub',
    prerequisite_check: 'Nessuna esperienza richiesta: parti da zero con il terminale.',
    category: 'Fullstack',
    level: 'Beginner',
    duration: 10,
    price: 0,
    icon: 'Code2',
    image_url: '/corsi/git.png',
    tags: ['git', 'github', 'version-control', 'ci-cd'],
    prerequisites: ['Nessuna esperienza con Git richiesta'],
    next_course_slug: 'sql-database',
    learning_objectives: [
      'Padroneggiare commit, branch e merge',
      'Gestire conflitti con sicurezza',
      'Collaborare con pull request e code review',
      'Configurare GitHub Actions per CI/CD',
    ],
    instructor_name: 'Gabriele Forestieri',
    instructor_bio: 'Fullstack Developer & Founder',
    instructor_avatar: '',
    is_published: true,
  },
  {
    title: 'Java Enterprise',
    slug: 'java-enterprise',
    description: 'Programmazione OOP solida e architetture enterprise con Java e Spring Boot.',
    long_description: 'Java è ampiamente usato in contesti enterprise per applicazioni robuste e manutenibili. Il corso consolida le basi OOP e introduce architetture usate in sistemi strutturati, con Spring Boot, JPA/Hibernate, microservizi e deploy su cloud, accompagnati da esercitazioni pratiche e un progetto finale.',
    subtitle: 'Dalle basi OOP a Spring Boot, JPA/Hibernate e microservizi in produzione.',
    outcome: 'Avrai costruito un\'app enterprise con Spring Boot, persistenza JPA e test, pronta per il portfolio.',
    lesson_duration: 15,
    stack_version: 'Java 17 + Spring Boot 3 + JPA/Hibernate',
    prerequisite_check: 'Sai già programmare in almeno un linguaggio? Se no, inizia da JavaScript Pro.',
    category: 'Backend',
    level: 'Intermedio',
    duration: 60,
    price: 0,
    icon: 'Code2',
    image_url: '/corsi/java.png',
    tags: ['java', 'spring-boot', 'jpa', 'oop', 'backend'],
    prerequisites: ['Esperienza con almeno un linguaggio di programmazione', 'Conoscenze base di SQL'],
    next_course_slug: 'docker-devops',
    learning_objectives: [
      'Padroneggiare Java 17+ e le sue feature moderne',
      'Progettare API REST con Spring Boot',
      'Gestire la persistenza con JPA/Hibernate',
      'Implementare microservizi e architetture enterprise',
      'Scrivere test unitari e di integrazione',
    ],
    instructor_name: 'Gabriele Forestieri',
    instructor_bio: 'Fullstack Developer & Founder',
    instructor_avatar: '',
    is_published: true,
  },
];

async function seed() {
  console.log('Checking existing courses...');

  const { data: existing } = await supabase
    .from('courses')
    .select('slug');

  const existingSlugs = new Set((existing || []).map((c: { slug: string }) => c.slug));
  const toInsert = newCourses.filter((c) => !existingSlugs.has(c.slug));

  if (toInsert.length === 0) {
    console.log('All courses already exist in the database.');
    return;
  }

  console.log(`Inserting ${toInsert.length} new courses...`);

  // I campi di collegamento (propedeutico/successivo) vanno risolti dopo
  // l'insert: lo slug non è ancora un id valido al momento della creazione.
  const insertData = toInsert.map(({ prerequisite_course_slug, next_course_slug, ...course }) => course);

  const { error } = await supabase
    .from('courses')
    .insert(insertData);

  if (error) {
    console.error('Error inserting courses:', error);
    process.exit(1);
  }

  console.log(`✓ Successfully inserted ${toInsert.length} courses!`);

  // Collega i corsi propedeutici/successivi tramite slug
  const linkable = newCourses.filter(
    (c) => c.prerequisite_course_slug || c.next_course_slug,
  );
  if (linkable.length > 0) {
    const { data: all } = await supabase.from('courses').select('id, slug');
    const slugToId = new Map((all || []).map((c: { id: string; slug: string }) => [c.slug, c.id]));

    for (const c of linkable) {
      const update: Record<string, string> = {};
      if (c.prerequisite_course_slug && slugToId.has(c.prerequisite_course_slug)) {
        update.prerequisite_course_id = slugToId.get(c.prerequisite_course_slug)!;
      }
      if (c.next_course_slug && slugToId.has(c.next_course_slug)) {
        update.next_course_id = slugToId.get(c.next_course_slug)!;
      }
      if (Object.keys(update).length > 0) {
        const { error: linkError } = await supabase
          .from('courses')
          .update(update)
          .eq('slug', c.slug);
        if (linkError) {
          console.error(`Error linking course ${c.slug}:`, linkError.message);
        } else {
          console.log(`✓ Linked ${c.slug}`);
        }
      }
    }
  }
}

seed();
