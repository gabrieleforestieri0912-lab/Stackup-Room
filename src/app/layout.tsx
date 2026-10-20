import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { Analytics as VercelAnalytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import Providers from './providers';
import Analytics from '@/components/ui/Analytics';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import JsonLd from '@/components/ui/JsonLd';
import { SITE_NAME, SITE_TAGLINE, organizationJsonLd, websiteJsonLd, siteUrl, absUrl } from '@/lib/seo';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const baseUrl = siteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Stackup Room | Master Your Code',
    template: '%s | Stackup Room',
  },
  description: SITE_TAGLINE,
  keywords: [
    'corsi programmazione',
    'imparare a programmare',
    'corso React',
    'corso Next.js',
    'corso Node.js',
    'corso Python',
    'corso TypeScript',
    'mentoring programmazione',
    'coding bootcamp italiano',
    'sviluppatore web',
    'Stackup Room',
  ],
  applicationName: SITE_NAME,
  authors: [{ name: 'Gabriele Forestieri' }],
  category: 'technology',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [{ url: '/stackup.png', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'it_IT',
    url: baseUrl,
    title: 'Stackup Room | Master Your Code',
    description: SITE_TAGLINE,
    images: [{ url: absUrl('/stackup-og.svg'), width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stackup Room | Master Your Code',
    description: SITE_TAGLINE,
    images: [absUrl('/stackup-og.svg')],
  },
};

export const viewport: Viewport = {
  themeColor: '#ea580c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="it"
      className={`${jetbrainsMono.variable}`}
    >
      <head>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <link rel="alternate" type="text/plain" href="/llms.txt" title={`${SITE_NAME} llms.txt`} />
      </head>
      <body className="antialiased h-full min-h-full bg-black text-zinc-100 overflow-x-hidden w-full max-w-100vw">
        <Analytics />
        <VercelAnalytics />
        <SpeedInsights />
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}

