import { getPublishedCourses, siteUrl, SITE_NAME, SITE_TAGLINE } from '@/lib/seo';
import { GUIDE_CARDS, PATHS, ALL_RESOURCES } from '@/data/landingData';
import { AI_SKILLS } from '@/data/aiSkillsData';

export const dynamic = 'force-dynamic';

function esc(text: string): string {
  return text.replace(/[\r\n]+/g, ' ').trim();
}

export async function GET() {
  const base = siteUrl();
  const courses = await getPublishedCourses();

  const lines: string[] = [];
  lines.push(`# ${SITE_NAME}`);
  lines.push('');
  lines.push(`> ${SITE_TAGLINE}`);
  lines.push('');
  lines.push('Stackup Room è una piattaforma di corsi di programmazione in italiano, project-based, con mentoring 1:1. Ogni corso include lezioni pratiche, esercizi guidati con checkpoint, materiali di supporto e un certificato finale. I corsi sono pensati per sviluppatori principianti e intermedi che vogliono costruire applicazioni reali.');
  lines.push('');
  lines.push('## Courses');
  lines.push('');
  for (const c of courses) {
    lines.push(`- [${c.title}](${base}/courses/${c.slug}): ${esc(c.description || `Corso pratico su ${c.title}`)}`);
  }
  lines.push('');
  lines.push('## Paths');
  lines.push('');
  for (const p of PATHS) {
    lines.push(`- [${p.title}](${base}${p.href}): ${esc(p.description)}`);
  }
  lines.push('');
  lines.push('## Guides');
  lines.push('');
  for (const g of GUIDE_CARDS) {
    lines.push(`- [${g.title}](${base}${g.href}): ${esc(g.desc)}`);
  }
  lines.push('');
  lines.push('## Resources');
  lines.push('');
  for (const r of ALL_RESOURCES) {
    lines.push(`- [${r.title}](${base}${r.href}): ${esc(r.desc)}`);
  }
  lines.push('');
  lines.push('## AI Skills');
  lines.push('');
  for (const s of AI_SKILLS) {
    lines.push(`- [${s.title}](${base}${s.href}): ${esc(s.desc)}`);
  }
  lines.push('');
  lines.push('## Key pages');
  lines.push('');
  lines.push(`- [Home](${base}/)`);
  lines.push(`- [Corsi](${base}/courses)`);
  lines.push(`- [Percorsi](${base}/paths)`);
  lines.push(`- [Guide](${base}/guide)`);
  lines.push(`- [Risorse](${base}/resources)`);
  lines.push('');
  lines.push('Questa è la versione sintetica: per il contenuto completo vedi /llms-full.txt');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
