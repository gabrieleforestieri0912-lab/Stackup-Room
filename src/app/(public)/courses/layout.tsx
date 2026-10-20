import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Corsi',
  description:
    'Catalogo corsi Stackup Room: dal frontend al backend, dall\'AI al mobile. Ogni corso è pratico, con progetti reali e mentori senior.',
  alternates: { canonical: '/courses' },
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
