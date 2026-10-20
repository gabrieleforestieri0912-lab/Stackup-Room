import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Risorse',
  description:
    'Risorse e strumenti Stackup Room: template, checklist, kit e roadmap per costruire il tuo prodotto.',
  alternates: { canonical: '/resources' },
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
