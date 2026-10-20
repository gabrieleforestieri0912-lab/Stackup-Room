import React from 'react';
import Head from 'next/head';

interface SEOProps {
 title?: string;
 description?: string;
 keywords?: string;
 image?: string;
 url?: string;
}

const SEO = ({ title, description, keywords, image, url }: SEOProps) => {
  const siteName = "Stackup Room";
 const defaultTitle = "Master Your Code";
 const fullTitle = title ? `${title} | ${siteName}` : `${siteName} | ${defaultTitle}`;
 const defaultDescription = "La community dove imparare a programmare sul serio. Corsi di React, Next.js, Node.js, Python, TypeScript e tanto altro con mentorship 1:1.";
 const metaDescription = description || defaultDescription;
 const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const canonicalUrl = `${baseUrl}${url || ''}`;

 return (
  <Head>
   <title>{fullTitle}</title>
   <meta name="description" content={metaDescription} />
   <meta name="viewport" content="width=device-width, initial-scale=1" />
   {keywords && <meta name="keywords" content={keywords} />}
   <link rel="canonical" href={canonicalUrl} />
   <meta name="theme-color" content="#ea580c" />

   {/* Open Graph / Facebook */}
   <meta property="og:type" content="website" />
   <meta property="og:url" content={canonicalUrl} />
   <meta property="og:site_name" content={siteName} />
   <meta property="og:title" content={fullTitle} />
   <meta property="og:description" content={metaDescription} />
   <meta property="og:image" content={image || "/stackup-og.svg"} />

   {/* Twitter */}
   <meta name="twitter:card" content="summary_large_image" />
   <meta name="twitter:url" content={canonicalUrl} />
   <meta name="twitter:title" content={fullTitle} />
   <meta name="twitter:description" content={metaDescription} />
   <meta name="twitter:image" content={image || "/stackup-og.png"} />
  </Head>
 );
};

export default SEO;

