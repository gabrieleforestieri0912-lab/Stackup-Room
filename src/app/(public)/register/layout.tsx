import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registrati',
  description:
    'Crea il tuo account Stackup Room e inizia il tuo viaggio verso l\'eccellenza tecnica. Mentorship 1:1, progetti reali e una community di sviluppatori.',
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
