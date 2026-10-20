import { getPublishedCourses, siteUrl, SITE_NAME, SITE_TAGLINE } from '@/lib/seo';
import { GUIDE_CARDS, PATHS, ALL_RESOURCES, FAQ } from '@/data/landingData';
import { AI_SKILLS } from '@/data/aiSkillsData';

export const dynamic = 'force-dynamic';

function esc(text: string): string {
  return text.replace(/[\r\n]+/g, ' ').trim();
}

export async function GET() {
  const base = siteUrl();
  const courses = await getPublishedCourses();

  const out: string[] = [];
  out.push(`# ${SITE_NAME}`);
  out.push('');
  out.push(`> ${SITE_TAGLINE}`);
  out.push('');
  out.push('## Chi siamo');
  out.push('');
  out.push('Stackup Room è una piattaforma di formazione in programmazione in lingua italiana fondata da Gabriele Forestieri. L\'approccio è project-based: ogni corso porta lo studente a costruire un progetto reale e deployabile, con esercizi guidati, checkpoint di verifica, materiali di supporto e mentoring 1:1. Non è una raccolta di tutorial: è un metodo strutturato per trasformare principianti e intermedi in sviluppatori pronti per il mondo del lavoro.');
  out.push('');
  out.push('### Cosa rende Stackup Room diversa');
  out.push('');
  out.push('- Mentorship 1:1 con sviluppatori senior');
  out.push('- Progetti reali che finiscono in produzione e nel portfolio');
  out.push('- Esercizi con checkpoint pratici, non solo quiz teorici');
  out.push('- Materiali per modulo: repo starter/soluzione, cheat sheet, documentazione ufficiale');
  out.push('- Certificato finale al completamento del corso');
  out.push('');
  out.push('## Courses');
  out.push('');
  out.push('Ogni corso ha una parte gratuita e si sblocca completamente con l\'abbonamento Stackup Room. I corsi includono moduli progressivi, esercizi con XP e streak, e un progetto finale.');
  out.push('');
  for (const c of courses) {
    out.push(`### [${c.title}](${base}/courses/${c.slug})`);
    out.push('');
    out.push(esc(c.description || `Corso pratico su ${c.title}`));
    out.push('');
  }
  out.push('## Paths');
  out.push('');
  out.push('I percorsi (paths) combinano più corsi in un curriculum di carriera: frontend, backend, fullstack, mobile, DevOps, AI/ML, data science e cybersecurity. Ogni percorso ha una durata, un numero di corsi e lezioni gratuite per iniziare.');
  out.push('');
  for (const p of PATHS) {
    out.push(`### [${p.title}](${base}${p.href})`);
    out.push('');
    out.push(esc(p.description));
    out.push('');
    out.push(`- Durata: ${p.duration} · ${p.courses} corsi · ${p.freeLessons} lezioni gratuite`);
    out.push(`- Competenze: ${p.highlights.join(', ')}`);
    out.push('');
  }
  out.push('## Guides');
  out.push('');
  out.push('Guide pratiche e gratuite per founder solitari e sviluppatori: validazione di idee, scelta dello stack, pricing, go-to-market, AI-first strategy, tooling e debugging mentale.');
  out.push('');
  for (const g of GUIDE_CARDS) {
    out.push(`### [${g.title}](${base}${g.href})`);
    out.push('');
    out.push(esc(g.desc));
    out.push('');
  }
  out.push('## Resources');
  out.push('');
  out.push('Risorse scaricabili: template, checklist, kit e roadmap. Alcune gratuite, altre riservate ai membri.');
  out.push('');
  for (const r of ALL_RESOURCES) {
    out.push(`### [${r.title}](${base}${r.href})`);
    out.push('');
    out.push(esc(r.desc));
    out.push('');
    out.push(`- ${r.minutes} minuti · ${r.free ? 'Gratuita' : 'Per membri'} · ${r.tags.join(', ')}`);
    out.push('');
  }
  out.push('## AI Skills');
  out.push('');
  out.push('Skill AI installabili per automatizzare i workflow di sviluppo: agent interfaces, customer discovery e generazione UGC.');
  out.push('');
  for (const s of AI_SKILLS) {
    out.push(`### [${s.title}](${base}${s.href})`);
    out.push('');
    out.push(esc(s.desc));
    out.push('');
  }
  out.push('## Domande frequenti');
  out.push('');
  for (const f of FAQ) {
    out.push(`### ${esc(f.q)}`);
    out.push('');
    out.push(esc(f.a));
    out.push('');
  }
  out.push('## Accesso');
  out.push('');
  out.push(`La registrazione è gratuita: [registrati qui](${base}/register). L'abbonamento Stackup Room sblocca tutti i corsi, i percorsi completi, le risorse premium e il mentoring 1:1.`);
  out.push('');
  out.push(`Versione sintetica: ${base}/llms.txt`);

  return new Response(out.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
