import type { Metadata } from 'next';
import JsonLd from '@/components/ui/JsonLd';
import { GUIDE_CARDS } from '@/data/landingData';
import { absUrl, articleJsonLd, breadcrumbJsonLd } from '@/lib/seo';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = GUIDE_CARDS.find((g) => g.href === `/guide/${slug}`);

  if (guide) {
    return {
      title: `${guide.title} | Stackup Room`,
      description: guide.desc,
      alternates: { canonical: `/guide/${slug}` },
    };
  }

  return {
    title: 'Guida | Stackup Room',
    description: 'Guida pratica Stackup Room.',
    alternates: { canonical: `/guide/${slug}` },
  };
}

export default async function GuideDetailLayout({ children, params }: { children: React.ReactNode } & Props) {
  const { slug } = await params;
  const guide = GUIDE_CARDS.find((g) => g.href === `/guide/${slug}`);

  return (
    <>
      {guide && (
        <JsonLd
          data={articleJsonLd({
            headline: guide.title,
            description: guide.desc,
            url: absUrl(`/guide/${slug}`),
          })}
        />
      )}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absUrl('/') },
          { name: 'Guide', url: absUrl('/guide') },
          { name: guide?.title || slug, url: absUrl(`/guide/${slug}`) },
        ])}
      />
      {children}
    </>
  );
}
