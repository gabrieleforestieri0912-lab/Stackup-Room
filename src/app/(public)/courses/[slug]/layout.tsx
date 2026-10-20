import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';
import JsonLd from '@/components/ui/JsonLd';
import { absUrl, courseJsonLd, breadcrumbJsonLd } from '@/lib/seo';

interface Props {
  params: Promise<{ slug: string }>;
}

interface CourseRow {
  title: string;
  description: string;
  price: number | null;
  level: string | null;
  duration: number | null;
  image_url: string | null;
  tags: string[] | null;
  subtitle: string | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (course) {
      return {
        title: `${course.title} | Stackup Room`,
        description:
          course.subtitle ||
          course.description ||
          `Impara ${course.title} su Stackup Room: lezioni pratiche, esercizi guidati e progetto finale.`,
        alternates: { canonical: `/courses/${slug}` },
      };
    }
  } catch {
    // ignora: fallisce al titolo generico
  }

  return {
    title: 'Corso | Stackup Room',
    description: 'Dettaglio corso Stackup Room.',
    alternates: { canonical: `/courses/${slug}` },
  };
}

async function getCourse(slug: string): Promise<CourseRow | null> {
  try {
    const { data } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    return (data as CourseRow) || null;
  } catch {
    return null;
  }
}

export default async function CourseDetailLayout({ children, params }: { children: React.ReactNode } & Props) {
  const { slug } = await params;
  const course = await getCourse(slug);

  return (
    <>
      {course && (
        <JsonLd
          data={courseJsonLd({
            title: course.title,
            description: course.subtitle || course.description || '',
            url: absUrl(`/courses/${slug}`),
            image: course.image_url || undefined,
            price: typeof course.price === 'number' ? course.price : undefined,
            level: course.level || undefined,
            durationHours: typeof course.duration === 'number' ? course.duration : undefined,
            tags: course.tags || undefined,
          })}
        />
      )}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absUrl('/') },
          { name: 'Corsi', url: absUrl('/courses') },
          { name: course?.title || slug, url: absUrl(`/courses/${slug}`) },
        ])}
      />
      {children}
    </>
  );
}
