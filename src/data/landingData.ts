import { Code2, Globe, Target, Rocket, Database, Layout, Palette, Brain, TrendingUp, Zap, Map, Calendar, Lightbulb, Megaphone, Wrench, DollarSign } from 'lucide-react'

export interface CourseItem {
  id: string
  title: string
  tag: string
  level: string
  duration: number
  price: number
  students: number
  imageUrl: string
  color: string
  description?: string
  skills?: string[]
}

export interface PathItem {
  id: string;
  title: string;
  tag: string;
  duration: string;
  courses: number;
  price: number;
  color: string;
  description: string;
  highlights: string[];
  href: string;
  freeLessons: number;
}

export const PATHS: PathItem[] = [
  {
    id: 'frontend',
    title: 'Frontend Developer',
    tag: 'Crea interfacce utente moderne',
    duration: '12 settimane',
    courses: 5,
    price: 299,
    color: 'orange',
    description: 'Dai primi tag HTML a applicazioni React complesse. Diventa lo specialista che ogni azienda cerca.',
    highlights: ['HTML & CSS semantico', 'JavaScript ES6+', 'React & Next.js', 'Tailwind & TypeScript'],
    href: '/path/frontend',
    freeLessons: 3,
  },
  {
    id: 'backend',
    title: 'Backend Developer',
    tag: 'Costruisci back-end performanti',
    duration: '14 settimane',
    courses: 5,
    price: 349,
    color: 'blue',
    description: 'API REST, database, autenticazione e deployment: tutto quello che serve per essere un backend engineer.',
    highlights: ['Node.js & Express', 'Python & FastAPI', 'SQL & PostgreSQL', 'Autenticazione & API'],
    href: '/path/backend',
    freeLessons: 3,
  },
  {
    id: 'fullstack',
    title: 'Fullstack Mastery',
    tag: 'Percorso completo, niente filtri',
    duration: '24 settimane',
    courses: 11,
    price: 699,
    color: 'purple',
    description: 'Diventa l\'architetto che sa muoversi dal database al DOM. Senior engineer a tutti gli effetti.',
    highlights: ['Frontend + Backend', 'DevOps & CI/CD', 'System Design', 'Deploy & monitoraggio'],
    href: '/path/fullstack',
    freeLessons: 5,
  },
  {
    id: 'mobile',
    title: 'Mobile Developer',
    tag: 'Sviluppa app cross-platform',
    duration: '10 settimane',
    courses: 2,
    price: 249,
    color: 'emerald',
    description: 'Impara a creare app per iOS e Android con tecnologie cross-platform moderne.',
    highlights: ['React Native', 'Navigazione & API', 'Pubblicazione su store'],
    href: '/path/mobile',
    freeLessons: 2,
  },
  {
    id: 'devops',
    title: 'DevOps Engineer',
    tag: 'Automatizza e scala infrastrutture',
    duration: '10 settimane',
    courses: 4,
    price: 279,
    color: 'cyan',
    description: 'CI/CD, container, cloud e monitoring: diventa l\'ingegnere che tiene in piedi tutto.',
    highlights: ['Docker & Kubernetes', 'CI/CD pipelines', 'Cloud (AWS/GCP/Azure)', 'Monitoring & logging'],
    href: '/path/devops',
    freeLessons: 2,
  },
  {
    id: 'ai-ml',
    title: 'AI & Machine Learning',
    tag: 'Costruisci modelli e agenti AI',
    duration: '16 settimane',
    courses: 6,
    price: 449,
    color: 'pink',
    description: 'Python, ML, LLM e AI agents: dal dato al modello in produzione.',
    highlights: ['Python ML stack', 'LLM & AI agents', 'RAG & vettori', 'Deploy di modelli'],
    href: '/path/ai-ml',
    freeLessons: 4,
  },
  {
    id: 'data-science',
    title: 'Data Scientist',
    tag: 'Trasforma dati in decisioni',
    duration: '12 settimane',
    courses: 4,
    price: 329,
    color: 'yellow',
    description: 'Analisi, visualizzazione e storytelling con i dati. Da SQL a dashboard interattive.',
    highlights: ['SQL & Python analitico', 'Pandas & NumPy', 'Visualization (Tableau/Looker)', 'Statistical modelling'],
    href: '/path/data-science',
    freeLessons: 3,
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity Analyst',
    tag: 'Proteggi sistemi e reti',
    duration: '12 settimane',
    courses: 4,
    price: 379,
    color: 'red',
    description: 'Ethical hacking, threat analysis e security operations per difendere il digitale.',
    highlights: ['Network security', 'Ethical hacking', 'Incident response', 'Compliance & auditing'],
    href: '/path/cybersecurity',
    freeLessons: 2,
  },
]

export const COURSES_DATA: CourseItem[] = [
  { id: 'python-mastery', title: 'Python Mastery', tag: 'Backend', level: 'Beginner', duration: 40, price: 0, students: 12450, imageUrl: '/corsi/python.png', color: '#3776AB', description: 'Da zero a developer backend: Django, FastAPI, database e deployment.', skills: ['Python', 'Django', 'FastAPI'] },
  { id: 'java-enterprise', title: 'Java Enterprise', tag: 'Backend', level: 'Intermedio', duration: 60, price: 0, students: 8900, imageUrl: '/corsi/java.png', color: '#ED8B00', description: 'Programmazione OOP solida e architetture enterprise con Java e Spring Boot.', skills: ['Java', 'Spring Boot', 'JPA'] },
  { id: 'javascript-pro', title: 'JavaScript Pro', tag: 'Fullstack', level: 'Beginner', duration: 45, price: 0, students: 18900, imageUrl: '/corsi/javascript.png', color: '#F7DF1E', description: 'Domina l\'ecosistema JS per costruire logica frontend e backend robusta.', skills: ['ES6+', 'Async/Await', 'Fetch API'] },
  { id: 'html-strutturale', title: 'HTML Strutturale', tag: 'Frontend', level: 'Beginner', duration: 15, price: 0, students: 22100, imageUrl: '/corsi/html.png', color: '#E34F26', description: 'Padroneggia la semantica del web per creare interfacce accessibili e solide.', skills: ['HTML5', 'Semantic HTML', 'SEO'] },
  { id: 'css-moderno', title: 'CSS Moderno', tag: 'Frontend', level: 'Beginner', duration: 25, price: 0, students: 15400, imageUrl: '/corsi/css.png', color: '#1572B6', description: 'Layout moderni, animazioni e design system con Flexbox, Grid e CSS avanzato.', skills: ['Flexbox', 'Grid', 'Animations'] },
  { id: 'typescript-mastery', title: 'TypeScript Mastery', tag: 'Fullstack', level: 'Intermedio', duration: 35, price: 0, students: 11200, imageUrl: '/corsi/typescript.png', color: '#3178C6', description: 'Tipizzazione avanzata, generics e pattern moderni per codice JS robusto.', skills: ['TypeScript', 'Generics', 'React + TS'] },
  { id: 'node-express-api', title: 'Node.js & Express API', tag: 'Backend', level: 'Intermedio', duration: 35, price: 0, students: 13500, imageUrl: '/corsi/node.png', color: '#339933', description: 'Backend JavaScript con Node.js, Express, middleware e API RESTful.', skills: ['Node.js', 'Express', 'PostgreSQL'] },
  { id: 'react-modern-frontend', title: 'React & Modern Frontend', tag: 'Frontend', level: 'Intermedio', duration: 40, price: 0, students: 19800, imageUrl: '/corsi/react.png', color: '#61DAFB', description: 'Componenti, hooks, state management e pattern avanzati per UI moderne.', skills: ['React 19', 'Next.js', 'TypeScript'] },
  { id: 'nextjs-fullstack-pro', title: 'Next.js Fullstack Pro', tag: 'Frontend', level: 'Intermedio', duration: 30, price: 0, students: 4200, imageUrl: '/corsi/next.png', color: '#000000' },
  { id: 'angular-enterprise', title: 'Angular Enterprise', tag: 'Frontend', level: 'Intermedio', duration: 35, price: 0, students: 6800, imageUrl: '/corsi/angular.png', color: '#DD0031' },
  { id: 'tailwind-css', title: 'Tailwind CSS', tag: 'Frontend', level: 'Beginner', duration: 15, price: 0, students: 4300, imageUrl: '/corsi/tailwind.png', color: '#06B6D4', description: 'Utility-first CSS framework per costruire interfacce moderne rapidamente.', skills: ['Tailwind', 'Responsive', 'Design System'] },
  { id: 'chrome-extensions', title: 'Chrome Extensions', tag: 'Frontend', level: 'Intermedio', duration: 15, price: 0, students: 3200, imageUrl: '/corsi/chrome.png', color: '#4285F4', description: 'Crea estensioni Chrome: da utility a add-on complessi con API e servizi.', skills: ['Manifest V3', 'Chrome API', 'Service Workers'] },
  { id: 'landing-page-design', title: 'Landing Page Design', tag: 'Frontend', level: 'Beginner', duration: 20, price: 0, students: 5600, imageUrl: '/corsi/landing.png', color: '#FF6B6B', description: 'Design e sviluppo di landing page ad alta conversione con Next.js e Tailwind.', skills: ['Design', 'Next.js', 'Tailwind', 'Conversion'] },
  { id: 'nextjs-saas', title: 'Next.js SaaS Starter', tag: 'Frontend', level: 'Intermedio', duration: 25, price: 0, students: 3800, imageUrl: '/corsi/next-saas.png', color: '#000000', description: 'Costruisci una web app SaaS completa: auth, pagamenti, dashboard e deploy.', skills: ['Next.js', 'Stripe', 'Auth', 'Fullstack'] },
  { id: 'go-backend', title: 'Go Backend', tag: 'Backend', level: 'Intermedio', duration: 30, price: 0, students: 4100, imageUrl: '/corsi/go.png', color: '#00ADD8', description: 'Backend performanti con Go: API REST, concorrenza, database e microservizi.', skills: ['Go', 'API REST', 'Concurrency', 'Microservizi'] },
  { id: 'docker-devops', title: 'Docker & DevOps', tag: 'Backend', level: 'Intermedio', duration: 20, price: 0, students: 7200, imageUrl: '/corsi/docker.png', color: '#2496ED', description: 'Containerizzazione, CI/CD e orchestrazione per ambienti di produzione moderni.', skills: ['Docker', 'CI/CD', 'Kubernetes', 'DevOps'] },
  { id: 'sql-database', title: 'SQL & Database Design', tag: 'Backend', level: 'Beginner', duration: 25, price: 0, students: 9800, imageUrl: '/corsi/sql.png', color: '#336791', description: 'Progetta database relazionali solidi: modellazione, query, indici e performance.', skills: ['SQL', 'PostgreSQL', 'Database Design', 'Query Optimization'] },
  { id: 'git-github', title: 'Git & GitHub', tag: 'Fullstack', level: 'Beginner', duration: 10, price: 0, students: 15300, imageUrl: '/corsi/git.png', color: '#F05032', description: 'Controllo versione e collaborazione professionale con Git e GitHub.', skills: ['Git', 'GitHub', 'Version Control', 'Collaboration'] },
]

export const COURSES_PREVIEW = COURSES_DATA.slice(0, 6)

export const FAQ = [
  {
    q: "Quali corsi offre Stackup?",
    a: "Offriamo 18 corsi pratici tra frontend, backend e tooling: da HTML, CSS e JavaScript a React, Next.js, Angular, TypeScript, Python, Java, Go, Node.js, SQL, Docker, Tailwind CSS, Git e altro. Ogni corso combina teoria essenziale, esercizi interattivi e progetti reali."
  },
  {
    q: "I corsi sono adatti a principianti?",
    a: "Sì. I corsi indicati come Beginner partono dalle basi e non richiedono esperienza pregressa. I corsi Intermedio richiedono invece familiarità con i fondamenti di programmazione: ogni scheda corso elenca i prerequisiti consigliati."
  },
  {
    q: "Come funziona il mentoring 1:1?",
    a: "Con l'abbonamento a Stackup Room hai accesso a sessioni di mentoring 1:1, code review e un piano di studio personalizzato in base ai tuoi obiettivi. La frequenza dipende dal piano scelto."
  },
  {
    q: "Ricevo una certificazione?",
    a: "Sì. Al completamento di tutti gli esercizi di un corso ottieni un certificato di completamento Stackup, scaricabile e condivisibile su LinkedIn e sul tuo curriculum."
  },
  {
    q: "Posso accedere ai corsi da mobile?",
    a: "Sì, la piattaforma è responsive e ottimizzata per desktop, tablet e smartphone, così puoi studiare dove e quando preferisci."
  },
  {
    q: "Che supporto ho dopo l'iscrizione?",
    a: "Hai accesso alla community privata, ai progetti guidati e al supporto del team. Pubblichiamo aggiornamenti regolari sui contenuti e sulle opportunità di confronto con altri studenti."
  }
]

export interface GuideCard {
  id: string;
  title: string;
  desc: string;
  tag: string;
  color: string;
  icon: React.ElementType;
  href: string;
}

export const GUIDE_CARDS: GuideCard[] = [
  {
    id: 'validazione',
    title: "Validare un'idea",
    desc: 'Come identificare un problema reale e verificare che qualcuno sia disposto a pagare per la soluzione.',
    tag: 'Ideazione',
    color: 'orange',
    icon: Lightbulb,
    href: '/guide/validare-idea',
  },
  {
    id: 'stack',
    title: 'Scegliere lo stack',
    desc: "Next.js, Supabase, Vercel: gli strumenti essenziali per shipvare veloce senza overengineering.",
    tag: 'Tecnologia',
    color: 'blue',
    icon: Code2,
    href: '/guide/scegliere-stack',
  },
  {
    id: 'pricing',
    title: 'Pricing & monetizzazione',
    desc: 'Modelli freemium, pay-per-use e tier pricing per massimizzare il revenue senza allontanare utenti.',
    tag: 'Business',
    color: 'emerald',
    icon: DollarSign,
    href: '/guide/pricing-gtm',
  },
  {
    id: 'gotomarket',
    title: 'Go-to-market solitario',
    desc: 'Product Hunt, Reddit, Twitter: strategie di lancio low-budget che funzionano per founder solitari.',
    tag: 'Marketing',
    color: 'purple',
    icon: TrendingUp,
    href: '/guide/go-to-market',
  },
  {
    id: 'ai-first-strategy',
    title: 'AI-first product strategy',
    desc: 'Progetta il prodotto partendo dal layer AI, non dall\'interfaccia. Integra modelli come vantaggio competitivo.',
    tag: 'Prodotto',
    color: 'red',
    icon: Target,
    href: '/guide/ai-first-strategy',
  },
  {
    id: 'tooling-automation',
    title: 'Tooling & automazione',
    desc: 'Automatizza tutto ciò che non è il tuo core prodotto: CI/CD, monitoring, billing, email e customer support.',
    tag: 'Tooling',
    color: 'cyan',
    icon: Wrench,
    href: '/guide/tooling-automation',
  },
  {
    id: 'debugging-mentale',
    title: 'Debugging mentale',
    desc: 'Come gestire ansia, procrastinazione e blocco del founder solitario mentre costruisci il tuo prodotto.',
    tag: 'Mindset',
    color: 'yellow',
    icon: Brain,
    href: '/guide/debugging-mentale',
  },
]
export interface ResourceHub {
  id: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  guides: string[];
}

export const RESOURCE_HUBS: ResourceHub[] = [
  {
    id: 'ideazione',
    title: 'Ideazione & Validazione',
    desc: 'Trova un problema reale, verifica la domanda e definisci il value proposition prima di scrivere codice.',
    icon: Lightbulb,
    guides: [
      'Come trovare un problema reale',
      'Tecniche di customer discovery',
      'Validare la domanda prima del codice',
      'Analisi competitor rapida',
      'Definire il value proposition',
      'Dal problema all\'MVP in 2 settimane',
    ],
  },
  {
    id: 'stack',
    title: 'Stack & Tecnologia',
    desc: 'Scegli gli strumenti giusti per shipvare veloce senza overengineering.',
    icon: Code2,
    guides: [
      'Scegliere il framework giusto',
      'Next.js per MVP veloci',
      'Database e storage per startup',
      'Autenticazione e auth',
      'AI/ML integration',
      'Deploy e hosting',
    ],
  },
  {
    id: 'design',
    title: 'Design & Prodotto',
    desc: 'Progetta UX che converte, costruisci landing page efficaci e itera velocemente.',
    icon: Palette,
    guides: [
      'UX per founder solitari',
      'Landing page che converte',
      'Wireframing rapido',
      'Design system minimale',
      'User testing senza budget',
      'Iterare basato su feedback',
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing & Lancio',
    desc: 'Lancia senza budget con strategie low-cost che funzionano per sviluppatori solitari.',
    icon: Megaphone,
    guides: [
      'Product Hunt strategy',
      'Content marketing per dev',
      'Build in public',
      'Reddit & community',
      'Email marketing per startup',
      'PR senza agenzia',
    ],
  },
  {
    id: 'monetizzazione',
    title: 'Monetizzazione & Growth',
    desc: 'Modelli di revenue, retention e scale per trasformare un progetto in un business.',
    icon: TrendingUp,
    guides: [
      'Pricing strategy',
      'Freemium vs paid',
      'Retention e churn',
      'Referral e viral loop',
      'Analytics e metriche',
      'Scale con zero budget',
    ],
  },
]

export interface ResourceLink {
  title: string;
  category: string;
  desc: string;
  href: string;
  memberNote: string;
  icon: React.ElementType;
  free?: boolean;
  tags: string[];
  minutes: number;
}

export const FREE_RESOURCES: ResourceLink[] = [
  {
    category: 'TEMPLATE',
    title: 'Template landing page',
    desc: 'Una landing page pronta all\'uso con Next.js e Tailwind. Deploy su Vercel in 5 minuti.',
    href: '/resources/template-landing',
    memberNote: '',
    icon: Rocket,
    free: true,
    tags: ['template', 'next.js', 'tailwind'],
    minutes: 15,
  },
  {
    category: 'CHECKLIST',
    title: 'Checklist pre-lancio',
    desc: 'Tutti i passaggi da verificare prima di mandare live il tuo prodotto: 32 item essenziali.',
    href: '/resources/checklist-pre-lancio',
    memberNote: '',
    icon: Zap,
    free: true,
    tags: ['checklist', 'lancio', 'deploy'],
    minutes: 5,
  },
  {
    category: 'GUIDA',
    title: 'Domini e hosting',
    desc: 'Come scegliere dominio, DNS e hosting. Guida pratica per evitare errori costosi.',
    href: '/resources/domini-hosting',
    memberNote: '',
    icon: Globe,
    free: true,
    tags: ['domini', 'hosting', 'dns'],
    minutes: 10,
  },
  {
    category: 'KIT',
    title: 'Wireframe kit per MVP',
    desc: 'Blocchi Figma riutilizzabili per progettare l\'interfaccia del tuo MVP in poche ore.',
    href: '/resources/wireframe-kit',
    memberNote: '',
    icon: Layout,
    free: true,
    tags: ['figma', 'wireframe', 'mvp'],
    minutes: 20,
  },
  {
    category: 'RISORSA',
    title: 'Roadmap sviluppatore 2026',
    desc: 'Tecnologie, tool e competenze richieste dal mercato: la mappa aggiornata per orientarti.',
    href: '/resources/roadmap-2026',
    memberNote: '',
    icon: Map,
    free: true,
    tags: ['roadmap', 'carriera', 'competenze'],
    minutes: 8,
  },
]

export const SHIP_RESOURCES: ResourceLink[] = [
  {
    category: 'INIZIA DA QUI',
    title: 'Piano di 30 giorni per il primo dollaro',
    desc: "Utilizzate questa sequenza come schema generale per passare dall'idea al segnale di pagamento.",
    href: '/resources/piano-30-giorni',
    memberNote: 'Roadmap completa e scorecard',
    icon: Calendar,
    free: false,
    tags: ['piano', '30-giorni', 'primo-dollaro'],
    minutes: 25,
  },
  {
    category: 'CONVALIDARE',
    title: 'Kit di validazione delle idee',
    desc: 'Prima di procedere con la compilazione, verifica che il problema sia sufficientemente specifico.',
    href: '/resources/kit-validazione-idee',
    memberNote: 'Quaderno di esercizi ed esempi',
    icon: Lightbulb,
    free: false,
    tags: ['validazione', 'idee', 'customer-discovery'],
    minutes: 15,
  },
  {
    category: 'RICHIESTA DI TEST',
    title: 'Offerta + Kit di test per landing page',
    desc: "Formula un'offerta chiara e verifica se le persone sono sufficientemente interessate da rispondere.",
    href: '/resources/kit-test-landing',
    memberNote: 'Foglio di lavoro, script ed esempi',
    icon: Megaphone,
    free: false,
    tags: ['test', 'landing', 'offerta'],
    minutes: 20,
  },
  {
    category: 'COSTRUIRE',
    title: 'La tua prima app del fine settimana',
    desc: 'Realizza una prima versione di piccole dimensioni, con una struttura sufficiente a poterla mostrare a qualcuno.',
    href: '/resources/prima-app-weekend',
    memberNote: 'Guida completa alla costruzione',
    icon: Wrench,
    free: false,
    tags: ['app', 'weekend', 'mvp'],
    minutes: 30,
  },
  {
    category: 'CRESCITA',
    title: 'Playbook di distribuzione organica',
    desc: 'Strategie testate per acquisire i primi 100 utenti senza budget pubblicitario.',
    href: '/resources/playbook-distribuzione',
    memberNote: 'Template e script di outreach',
    icon: TrendingUp,
    free: false,
    tags: ['crescita', 'distribuzione', 'organico'],
    minutes: 18,
  },
  {
    category: 'MONETIZZARE',
    title: 'Foglio di calcolo pricing & margini',
    desc: 'Modella costi API, margini e tier di prezzo per trovare il punto di equilibrio.',
    href: '/resources/foglio-pricing',
    memberNote: 'Foglio pre-compilato con formule',
    icon: DollarSign,
    free: false,
    tags: ['pricing', 'margini', 'costi'],
    minutes: 12,
  },
]

export const ALL_RESOURCES: ResourceLink[] = [...FREE_RESOURCES, ...SHIP_RESOURCES]
