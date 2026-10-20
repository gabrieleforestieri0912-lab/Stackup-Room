import type { Metadata } from 'next';
import JsonLd from '@/components/ui/JsonLd';
import { ALL_RESOURCES } from '@/data/landingData';
import { absUrl, articleJsonLd, breadcrumbJsonLd } from '@/lib/seo';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resource = ALL_RESOURCES.find((r) => r.href === `/resources/${slug}`);

  if (resource) {
    return {
      title: `${resource.title} | Stackup Room`,
      description: resource.desc,
      alternates: { canonical: `/resources/${slug}` },
    };
  }

  return {
    title: 'Risorsa | Stackup Room',
    description: 'Risorsa Stackup Room.',
    alternates: { canonical: `/resources/${slug}` },
  };
}

export default async function ResourceDetailLayout({ children, params }: { children: React.ReactNode } & Props) {
  const { slug } = await params;
  const resource = ALL_RESOURCES.find((r) => r.href === `/resources/${slug}`);

  return (
    <>
      {resource && (
        <JsonLd
          data={articleJsonLd({
            headline: resource.title,
            description: resource.desc,
            url: absUrl(`/resources/${slug}`),
          })}
        />
      )}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absUrl('/') },
          { name: 'Risorse', url: absUrl('/resources') },
          { name: resource?.title || slug, url: absUrl(`/resources/${slug}`) },
        ])}
      />
      {children}
    </>
  );
}
