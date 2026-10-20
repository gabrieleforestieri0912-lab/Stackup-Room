import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Password dimenticata',
  description:
    'Recupera l\'accesso al tuo account Stackup Room: ti inviamo un link per reimpostare la password.',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
