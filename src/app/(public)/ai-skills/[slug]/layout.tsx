import type { Metadata } from 'next';
import JsonLd from '@/components/ui/JsonLd';
import { AI_SKILLS } from '@/data/aiSkillsData';
import { absUrl, articleJsonLd, breadcrumbJsonLd } from '@/lib/seo';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const skill = AI_SKILLS.find((s) => s.id === slug);

  if (skill) {
    return {
      title: skill.title,
      description: skill.desc,
      alternates: { canonical: `/ai-skills/${slug}` },
    };
  }

  return {
    title: 'AI Skill',
    description: 'Skill AI Stackup Room.',
    alternates: { canonical: `/ai-skills/${slug}` },
  };
}

export default async function AiSkillLayout({ children, params }: { children: React.ReactNode } & Props) {
  const { slug } = await params;
  const skill = AI_SKILLS.find((s) => s.id === slug);

  return (
    <>
      {skill && (
        <JsonLd
          data={articleJsonLd({
            headline: skill.title,
            description: skill.desc,
            url: absUrl(`/ai-skills/${slug}`),
          })}
        />
      )}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: absUrl('/') },
          { name: 'Risorse', url: absUrl('/resources') },
          { name: skill?.title || slug, url: absUrl(`/ai-skills/${slug}`) },
        ])}
      />
      {children}
    </>
  );
}
