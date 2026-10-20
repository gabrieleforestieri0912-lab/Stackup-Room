import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Percorsi',
  description:
    'Percorsi di carriera Stackup Room: frontend, backend, fullstack, mobile, DevOps, AI e data science. Scegli la tua strada e diventa membro.',
  alternates: { canonical: '/paths' },
};

export default function PathsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
