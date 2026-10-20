import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guide',
  description:
    'Guide pratiche Stackup Room: dalla teoria al codice. Ideazione, stack, pricing, go-to-market e tooling per sviluppatori.',
  alternates: { canonical: '/guide' },
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
