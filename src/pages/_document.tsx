import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
 return (
 <Html lang="it">
 <Head>
 <link rel="icon" href="/stackup.png" type="image/png" />
 <link rel="preconnect" href="https://fonts.googleapis.com" />
 <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
 <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100..800&display=swap" rel="stylesheet" />
 </Head>
 <body className="antialiased h-full min-h-full">
 <Main />
 <NextScript />
 <noscript>
 <div style={{
  position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: '#f8fafc', fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: 20
 }}>
 <div>
 <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Stackup</h1>
 <p style={{ color: '#64748b', fontSize: 14 }}>Abilita JavaScript per utilizzare la piattaforma.</p>
 </div>
 </div>
 </noscript>
 </body>
 </Html>
 );
}
