import Head from 'next/head';
import React from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string[];
}

export const SEO: React.FC<SEOProps> = ({
  title = 'GeoGrid Dashboard',
  description = 'A powerful dashboard for managing and analyzing location data',
  image = '/og-image.png',
  url = 'https://geogrid-dashboard.com',
  type = 'website',
  keywords = ['dashboard', 'location', 'analytics', 'data'],
}) => {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <link rel="canonical" href={url} />
    </Head>
  );
}; 