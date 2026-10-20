import type { Metadata } from 'next';
import JsonLd from '@/components/ui/JsonLd';
import { PATHS } from '@/data/landingData';
import { absUrl, breadcrumbJsonLd } from '@/lib/seo';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const path = PATHS.find((p) => p.href === `/path/${slug}`);

  if (path) {
    return {
      title: path.title,
      description: path.description,
      alternates: { canonical: `/path/${slug}` },
    };
  }

  return {
    title: 'Percorso',
    description: 'Dettaglio percorso Stackup Room.',
    alternates: { canonical: `/path/${slug}` },
  };
}

export default async function PathDetailLayout({ children, params }: { children: React.ReactNode } & Props) {
  const { slug } = await params;
  const path = PATHS.find((p) => p.href === `/path/${slug}`);

  const programJsonLd = path
    ? {
        '@context': 'https://schema.org',
        '@type': 'EducationalOccupationalProgram',
        name: path.title,
        description: path.description,
        url: absUrl(`/path/${slug}`),
        provider: {
          '@type': 'Organization',
          name: 'Stackup Room',
          url: absUrl('/'),
        },
        educationalProgramMode: 'online',
        timeToComplete: path.duration,
        inLanguage: 'it-IT',
        numberOfCredits: path.courses,
        occupationalCategory: '15-1252' /* Software Developers */,
        offers: {
          '@type': 'Offer',
          price: path.price,
          priceCurrency: 'EUR',
          category: 'Paid',
        },
      }
    : null;

  return (
    <>
      {programJsonLd && <JsonLd data={programJsonLd} />}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absUrl('/') },
          { name: 'Percorsi', url: absUrl('/paths') },
          { name: path?.title || slug, url: absUrl(`/path/${slug}`) },
        ])}
      />
      {children}
    </>
  );
}
