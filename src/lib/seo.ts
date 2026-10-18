import { supabaseAdmin } from './supabase-admin';

export const SITE_NAME = 'StackUp Room';
export const SITE_TAGLINE =
  'La community per imparare a programmare con metodo pratico: corsi su React, Next.js, Node.js, Python e TypeScript con mentoring 1:1 e progetti reali.';

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://stackup.academy').replace(/\/$/, '');
}

export function absUrl(path: string): string {
  const base = siteUrl();
  if (/^https?:\/\//.test(path)) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export interface CourseMeta {
  title: string;
  slug: string;
  description: string;
}

let cachedCourses: CourseMeta[] | null = null;

/**
 * Corsi pubblicati dal DB. In caso di errore (o DB vuoto) torna ai dati
 * statici del catalogo, così sitemap e llms.txt non si rompono mai.
 */
export async function getPublishedCourses(): Promise<CourseMeta[]> {
  if (cachedCourses) return cachedCourses;
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('title, slug, description, is_published')
      .eq('is_published', true)
      .order('title');

    if (!error && data && data.length > 0) {
      cachedCourses = data.map((c) => ({
        title: c.title,
        slug: c.slug,
        description: c.description || '',
      }));
      return cachedCourses;
    }
  } catch {
    // fallback sotto
  }
  return fallbackCourses();
}

function fallbackCourses(): CourseMeta[] {
  // Slugs statici noti (usati anche dal catalogo /courses)
  const staticSlugs: { slug: string; title: string; description: string }[] = [
    { slug: 'python-mastery', title: 'Python Mastery', description: 'Da zero a developer backend: Django, FastAPI, database e deployment.' },
    { slug: 'java-enterprise', title: 'Java Enterprise', description: 'Programmazione OOP solida e architetture enterprise con Java e Spring Boot.' },
    { slug: 'javascript-pro', title: 'JavaScript Pro', description: "Domina l'ecosistema JS per costruire logica frontend e backend robusta." },
    { slug: 'html-strutturale', title: 'HTML Strutturale', description: 'Padroneggia la semantica del web per creare interfacce accessibili e solide.' },
    { slug: 'css-moderno', title: 'CSS Moderno', description: 'Layout moderni, animazioni e design system con Flexbox, Grid e CSS avanzato.' },
    { slug: 'typescript-mastery', title: 'TypeScript Mastery', description: 'Tipizzazione avanzata, generics e pattern moderni per codice JS robusto.' },
    { slug: 'node-express-api', title: 'Node.js & Express API', description: 'Backend JavaScript con Node.js, Express, middleware e API RESTful.' },
    { slug: 'react-modern-frontend', title: 'React & Modern Frontend', description: 'Componenti, hooks, state management e pattern avanzati per UI moderne.' },
    { slug: 'nextjs-fullstack-pro', title: 'Next.js Fullstack Pro', description: 'Fullstack con Next.js: App Router, Server Components, API e deploy.' },
    { slug: 'angular-enterprise', title: 'Angular Enterprise', description: 'Applicazioni enterprise con Angular: componenti, routing e state management.' },
    { slug: 'tailwind-css', title: 'Tailwind CSS', description: 'Utility-first CSS framework per costruire interfacce moderne rapidamente.' },
    { slug: 'chrome-extensions', title: 'Chrome Extensions', description: 'Crea estensioni Chrome: da utility a add-on complessi con API e servizi.' },
    { slug: 'landing-page-design', title: 'Landing Page Design', description: 'Design e sviluppo di landing page ad alta conversione con Next.js e Tailwind.' },
    { slug: 'nextjs-saas', title: 'Next.js SaaS Starter', description: 'Costruisci una web app SaaS completa: auth, pagamenti, dashboard e deploy.' },
    { slug: 'go-backend', title: 'Go Backend', description: 'Backend performanti con Go: API REST, concorrenza, database e microservizi.' },
    { slug: 'docker-devops', title: 'Docker & DevOps', description: 'Containerizzazione, CI/CD e orchestrazione per ambienti di produzione moderni.' },
    { slug: 'sql-database', title: 'SQL & Database Design', description: 'Progetta database relazionali solidi: modellazione, query, indici e performance.' },
    { slug: 'git-github', title: 'Git & GitHub', description: 'Controllo versione e collaborazione professionale con Git e GitHub.' },
  ];
  return staticSlugs;
}

/* ============================================================
 * Builder JSON-LD (schema.org)
 * ============================================================ */

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl()}/#organization`,
    name: SITE_NAME,
    url: siteUrl(),
    logo: absUrl('/stackup-og.svg'),
    description: SITE_TAGLINE,
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'gabriele.forestieri0912@gmail.com',
    sameAs: [],
    founder: {
      '@type': 'Person',
      name: 'Gabriele Forestieri',
    },
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl()}/#website`,
    name: SITE_NAME,
    url: siteUrl(),
    publisher: { '@id': `${siteUrl()}/#organization` },
    inLanguage: 'it-IT',
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function itemListJsonLd<T extends { name: string; url: string }>(items: T[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

export function articleJsonLd(input: {
  headline: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    url: input.url,
    image: input.image ? absUrl(input.image) : absUrl('/stackup-og.svg'),
    datePublished: input.datePublished || new Date().toISOString().split('T')[0],
    dateModified: input.dateModified || input.datePublished || new Date().toISOString().split('T')[0],
    inLanguage: 'it-IT',
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: siteUrl(),
    },
    publisher: { '@id': `${siteUrl()}/#organization` },
    mainEntityOfPage: input.url,
  };
}

export function courseJsonLd(input: {
  title: string;
  description: string;
  url: string;
  image?: string;
  price?: number;
  level?: string;
  durationHours?: number;
  tags?: string[];
  providerName?: string;
}) {
  const base = siteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: input.title,
    description: input.description,
    url: input.url,
    image: input.image ? absUrl(input.image) : absUrl('/stackup-og.svg'),
    inLanguage: 'it-IT',
    provider: {
      '@type': 'Organization',
      name: input.providerName || SITE_NAME,
      url: base,
    },
    ...(input.level
      ? {
          educationalLevel:
            input.level.toLowerCase() === 'beginner' || input.level.toLowerCase() === 'principiante'
              ? 'Beginner'
              : input.level.toLowerCase() === 'advanced' || input.level.toLowerCase() === 'avanzato'
                ? 'Advanced'
                : 'Intermediate',
        }
      : {}),
    ...(input.tags && input.tags.length > 0 ? { teaches: input.tags } : {}),
    ...(typeof input.durationHours === 'number' && input.durationHours > 0
      ? {
          timeRequired: `PT${input.durationHours}H`,
        }
      : {}),
    ...(typeof input.price === 'number'
      ? {
          offers: {
            '@type': 'Offer',
            price: input.price,
            priceCurrency: 'EUR',
            category: input.price === 0 ? 'Free' : 'Paid',
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
  };
}
