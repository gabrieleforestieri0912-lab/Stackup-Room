"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Badge from "@/components/ui/Badge";
import toast from "react-hot-toast";
import {
  Code2,
  Paintbrush,
  Terminal,
  Database,
  Globe,
  Cpu,
  Zap,
  Smartphone,
  Monitor,
  Layers,
  CheckCircle2,
  ArrowRight,
  Star,
  Clock,
} from "lucide-react";

type Section = "Basi" | "Framework" | "Competenze";

interface Course {
  _id: string;
  title: string;
  description: string;
  level: string;
  duration: number;
  icon: string;
  tag: string;
  category: string;
  slug: string;
  price: number;
  imageUrl: string;
  tier?: "free" | "community" | "premium";
}

const SECTION_ORDER: Section[] = ["Basi", "Framework", "Competenze"];

const SECTION_CONFIG: Record<
  Section,
  { title: string; description: string; icon: string }
> = {
  Basi: {
    title: "Basi",
    description:
      "I fondamenti del mestiere: linguaggi e tecnologie su cui costruire tutto il resto.",
    icon: "●",
  },
  Framework: {
    title: "Framework & Librerie",
    description: "Impara i tool che userai ogni giorno in produzione.",
    icon: "◆",
  },
  Competenze: {
    title: "Competenze Avanzate",
    description: "Backend, tipizzazione e skill da sviluppatore completo.",
    icon: "■",
  },
};

function getCourseSection(slug: string, tag: string): Section {
  const key = slug.toLowerCase();
  if (
    key.includes("html") ||
    key.includes("css") ||
    key.includes("javascript") ||
    key.includes("git")
  )
    return "Basi";
  if (
    key.includes("react") ||
    key.includes("nextjs") ||
    key.includes("angular") ||
    key.includes("tailwind") ||
    key.includes("chrome") ||
    key.includes("landing")
  )
    return "Framework";
  return "Competenze";
}

function isLocked(slug: string): boolean {
  const locked = [
    "python-mastery",
    "javascript-pro",
    "typescript-mastery",
    "react-modern-frontend",
    "nextjs-fullstack-pro",
    "nextjs-saas",
    "angular-enterprise",
    "java-enterprise",
    "go-backend",
  ];
  return locked.includes(slug.toLowerCase());
}

interface IconMap {
  [key: string]: React.ComponentType<{ size?: number }>;
}

const iconMap: IconMap = {
  Paintbrush,
  Database,
  Globe,
  Terminal,
  Cpu,
  Code2,
  Zap,
  Smartphone,
  Monitor,
  Layers,
};

interface CourseCardProps {
  title: string;
  description: string;
  level: string;
  duration: number;
  IconComponent: React.ComponentType<{ size?: number }>;
  icon: string;
  tag: string;
  slug: string;
  price: number;
  imageUrl: string;
  _id: string;
  isEnrolled: boolean;
  tier?: "free" | "community" | "premium";
}

const TECH_ICONS: Record<string, string> = {
  javascript: "javascript",
  java: "openjdk",
  typescript: "typescript",
  python: "python",
  react: "react",
  next: "nextdotjs",
  node: "nodedotjs",
  html: "html5",
  tailwind: "tailwindcss",
  css: "css",
  sql: "postgresql",
  database: "postgresql",
  mongodb: "mongodb",
  git: "git",
  docker: "docker",
  aws: "amazonwebservices",
  rust: "rust",
  go: "go",
  flutter: "flutter",
  swift: "swift",
  kotlin: "kotlin",
  vue: "vuedotjs",
  angular: "angular",
  sass: "sass",
  figma: "figma",
  landing: "figma",
  chrome: "googlechrome",
  linux: "linux",
  c: "cplusplus",
};

function getTechIcon(slug: string): string {
  const key = slug.toLowerCase().replace(/[^a-z0-9]+/g, "");
  for (const [kw, icon] of Object.entries(TECH_ICONS)) {
    if (key.includes(kw)) return icon;
  }
  return "javascript";
}

// Alcuni loghi ufficiali sono scuri (neri/quasi neri) e sparirebbero sul
// fondo scuro delle card: forziamo una variante chiara o il colore brand.
// Simple Icons supporta: https://cdn.simpleicons.org/<slug>/<colore-hex|nome>
const TECH_ICON_COLORS: Record<string, string> = {
  nextdotjs: "white", // logo Next.js ufficiale bianco su nero
  openjdk: "white", // logo OpenJDK scuro
  angular: "DD0031", // rosso Angular ufficiale (simpleicons lo dà quasi nero)
  css: "2965F1", // azzurro CSS3 ufficiale (simpleicons lo dà viola scuro)
};

function getTechIconUrl(tech: string): string {
  const color = TECH_ICON_COLORS[tech];
  return `https://cdn.simpleicons.org/${tech}${color ? `/${color}` : ""}`;
}

const CourseCard: React.FC<CourseCardProps> = ({
  title,
  description,
  level,
  duration,
  IconComponent: Icon,
  icon,
  tag,
  slug,
  price,
  imageUrl,
  _id,
  isEnrolled,
  tier,
}) => {
  const tech = getTechIcon(slug || title);
  const locked = isLocked(slug);
  const href =
    !isEnrolled && locked ? `/courses/preview/${slug}` : `/courses/${slug}`;
  const router = useRouter();
  return (
    <Link
      href={href}
      className="flex flex-col h-full group bg-black/60 border border-zinc-800 hover:border-orange-300/30 transition-all duration-500 overflow-hidden rounded-2xl no-underline"
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-linear-to-br from-zinc-900 via-black to-zinc-950 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getTechIconUrl(tech)}
          alt={title}
          width={96}
          height={96}
          loading="lazy"
          className="w-20 h-20 sm:w-24 sm:h-24 object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-500"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />

        <div className="absolute bottom-3 left-3">
          <div className="w-9 h-9 bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-lg rounded-xl group-hover:border-orange-300/40 group-hover:bg-black/80 transition-all duration-500">
            <Icon size={18} />
          </div>
        </div>

        {!isEnrolled && locked && (
          <div className="absolute bottom-3 right-3">
            <div className="px-3.5 py-1.5 bg-orange-500/20 text-orange-300 font-black text-xs shadow-xl rounded-lg">
              Solo Membri
            </div>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col grow gap-3">
        <div className="flex items-center gap-2">
          {tag && (
            <span className="px-2.5 py-1 bg-orange-500/20 text-orange-300 text-[9px] rounded-lg font-black uppercase tracking-[0.2em]">
              {tag}
            </span>
          )}
          <span className="px-2.5 py-1 bg-zinc-900 text-zinc-400 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg">
            {level}
          </span>
        </div>

        <h3 className="text-[17px] font-jakarta font-bold text-zinc-100 leading-snug group-hover:text-orange-300 transition-colors line-clamp-2">
          {title}
        </h3>

        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">
          {description}
        </p>

        <div className="flex items-center gap-3 text-xs font-semibold text-zinc-400 mt-auto pt-1">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {duration} ore
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          {isEnrolled ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/courses/${slug}`);
              }}
              className="flex-1 py-3.5 bg-orange-500/20 text-orange-400 border border-orange-400/20 font-bold text-sm text-center hover:bg-orange-500/30 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>Continua</span>
              <ArrowRight size={16} />
            </button>
          ) : locked ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/courses/preview/${slug}`);
              }}
              className="flex-1 py-3.5 bg-black text-white border border-zinc-800 font-bold text-sm text-center hover:border-orange-300 hover:text-orange-300 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sblocca con Room</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/courses/${slug}`);
              }}
              className="flex-1 py-3.5 bg-orange-600 text-white font-bold text-sm text-center hover:bg-orange-500 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              <span>Inizia Gratis</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

const CoursesCatalog: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();
  const user = auth?.user;
  const refreshUser = auth?.refreshUser;
  const searchParams = useSearchParams();

  const fetchCourses = React.useCallback(async () => {
    try {
      const response = await fetch("/api/courses");
      const data = await response.json();
      if (data.success && data.data) {
        setCourses(data.data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (searchParams?.get("success") === "true") {
      refreshUser?.();
      toast.success("Pagamento completato con successo!", {
        duration: 5000,
        icon: "🎉",
      });
    }
  }, [searchParams, refreshUser]);

  const features: string[] = [
    "Video lezioni on-demand",
    "Esercitazioni pratiche",
    "Supporto didattico e community",
    "Certificato di completamento",
    "Accesso ai contenuti acquistati",
    "Progetti reali",
  ];

  const getIcon = (iconName: string): React.ComponentType<{ size?: number }> =>
    iconMap[iconName] || Terminal;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-16 space-y-24">
        <section className="relative max-w-3xl">
          <div className="space-y-6">
            <div className="h-5 w-32 skeleton" />
            <div className="h-12 w-3/4 skeleton" />
            <div className="h-12 w-1/2 skeleton" />
            <div className="space-y-3">
              <div className="h-6 w-full skeleton" />
              <div className="h-6 w-5/6 skeleton" />
            </div>
            <div className="h-12 w-44 skeleton" />
          </div>
        </section>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex flex-col h-full overflow-hidden skeleton-card"
              >
                <div className="aspect-video w-full skeleton rounded-none rounded-t-[calc(1rem-1px)]!" />
                <div className="p-8 flex flex-col grow space-y-3">
                  <div className="h-5 w-20 skeleton" />
                  <div className="h-6 w-3/4 skeleton" />
                  <div className="h-5 w-full skeleton" />
                  <div className="h-5 w-4/5 skeleton" />
                  <div className="h-5 w-16 skeleton" />
                  <div className="h-12 w-full skeleton mt-auto" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-6 pt-28 pb-16 space-y-24"
    >
      <section className="relative max-w-3xl">
        <div className="absolute inset-0 bg-orange-500/5 blur-3xl -z-10" />
        <div>
          <Badge>Il Metodo Stackup</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-jakarta font-black text-white mb-6 leading-[0.9] tracking-tight">
            Più della teoria, <br />
            <span className="text-orange-400">risultati reali.</span>
          </h2>
          <p className="text-lg text-zinc-400 font-medium leading-relaxed mb-8 max-w-xl">
            Ogni corso è costruito con focus su pratica e progetti reali: solo ciò che serve per lavorare con metodo professionale.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {features.map((feat, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-orange-500 shrink-0" />
                <span className="text-sm font-bold text-zinc-300">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {courses.length === 0 ? (
        <section>
          <div className="flex flex-col items-center mb-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-jakarta font-black text-white tracking-tight">
              Esplora il Catalogo
            </h2>
            <p className="text-zinc-500 font-medium text-sm mt-2">
              Ogni corso ha lezioni gratuite. Sblocca tutto con Stackup Room.
            </p>
            <div className="w-12 h-1 bg-orange-500/50 rounded-full mt-4"></div>
          </div>
          <div className="text-center py-20">
            <p className="text-zinc-400 font-bold text-lg">
              Nessun corso disponibile al momento.
            </p>
            <p className="text-zinc-400 text-sm mt-2">
              I corsi saranno pubblicati a breve. Torna a trovarci!
            </p>
          </div>
        </section>
      ) : (
        (() => {
          const grouped: Record<Section, Course[]> = {
            Basi: [],
            Framework: [],
            Competenze: [],
          };
          courses.forEach((course) => {
            const section = getCourseSection(course.slug, course.tag);
            if (grouped[section]) grouped[section].push(course);
          });

          return SECTION_ORDER.map((section) => {
            const sectionCourses = grouped[section];
            if (sectionCourses.length === 0) return null;

            return (
              <section key={section}>
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-jakarta font-black text-white tracking-tight">
                    {SECTION_CONFIG[section].title}
                  </h2>
                  <p className="text-zinc-500 font-medium text-sm mt-1">
                    {SECTION_CONFIG[section].description}
                  </p>
                  <div className="w-12 h-1 bg-orange-500/50 rounded-full mt-4" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {sectionCourses.map((course, index) => {
                    const isEnrolled = user?.enrolledCourses?.includes(
                      course._id,
                    );
                    return (
                      <motion.div
                        key={course._id || index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <CourseCard
                          {...course}
                          IconComponent={getIcon(course.icon)}
                          isEnrolled={isEnrolled ?? false}
                          tier={course.tier}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            );
          });
        })()
      )}

      <section className="bg-linear-to-br from-orange-500/10 via-black to-orange-600/5 border border-orange-500/10 p-10 sm:p-14 rounded-2xl relative overflow-hidden text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] -z-10" />
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <Badge>Stackup Room</Badge>
          <h2 className="text-3xl sm:text-4xl font-jakarta font-black text-white tracking-tight">
            Sblocca <span className="text-orange-400">tutti i corsi.</span>
          </h2>
          <p className="text-zinc-400 font-medium text-base leading-relaxed max-w-lg mx-auto">
            Ogni corso ha una parte gratuita per iniziare subito. Diventa membro
            di Stackup Room per accedere a lezioni complete, progetti in
            produzione e mentoring 1:1.
          </p>
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto pt-4">
            <div className="text-center">
              <div className="text-2xl font-black text-white">
                {courses.length}+
              </div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                Corsi
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-white">100%</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                Hands-on
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-white">1:1</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                Mentoring
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="px-8 py-3.5 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all inline-flex items-center gap-2"
            >
              Entra in Stackup Room <ArrowRight size={16} />
            </Link>
            <Link
              href="/paths"
              className="px-8 py-3.5 bg-black border border-zinc-800 text-zinc-200 font-bold text-sm hover:border-orange-400 hover:text-orange-400 transition-all rounded-xl inline-flex items-center gap-2"
            >
              Esplora i percorsi <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default CoursesCatalog;
