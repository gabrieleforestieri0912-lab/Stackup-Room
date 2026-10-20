import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description:
    'Accedi al tuo account Stackup Room per continuare il tuo percorso di apprendimento. Inserisci le tue credenziali e torna subito al codice.',
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
