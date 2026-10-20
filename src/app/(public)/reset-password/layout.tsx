import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nuova password',
  description: 'Imposta una nuova password per il tuo account Stackup Room.',
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
