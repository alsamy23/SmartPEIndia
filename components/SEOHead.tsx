import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { SEOConfig, DEFAULT_SEO_CONFIG, loadSEOConfig } from '../services/seoService.ts';

interface SEOHeadProps {
  activeTab?: string;
  customTitle?: string;
  customDescription?: string;
  schoolId?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  activeTab = 'dashboard',
  customTitle,
  customDescription,
  schoolId
}) => {
  const [config, setConfig] = useState<SEOConfig>(DEFAULT_SEO_CONFIG);

  useEffect(() => {
    let isMounted = true;
    loadSEOConfig(schoolId).then(loaded => {
      if (isMounted && loaded) {
        setConfig(loaded);
      }
    });

    const handleUpdated = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
      }
    };

    window.addEventListener('seo_config_updated', handleUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('seo_config_updated', handleUpdated);
    };
  }, [schoolId]);

  // Determine route override
  const routeOverride = config.routeOverrides?.[activeTab] || {};

  // Build clean base canonical domain prioritizing smartpeindia.app
  const rawBaseDomain = config.canonicalUrl || 'https://smartpeindia.app/';
  const baseDomain = rawBaseDomain.endsWith('/') ? rawBaseDomain : `${rawBaseDomain}/`;

  // Determine relative canonical path for current route
  const subPath = routeOverride.canonicalPath || (activeTab === 'dashboard' ? '' : `#${activeTab}`);
  const cleanSubPath = subPath.startsWith('/') ? subPath.slice(1) : subPath;
  const canonicalFullUrl = `${baseDomain}${cleanSubPath}`;

  // Determine Page Title
  const prefix = config.metaTitlePrefix || 'Smart PE India';
  const pageTitlePart = customTitle || routeOverride.title;
  let fullTitle: string;
  if (!pageTitlePart) {
    fullTitle = `${prefix} | #1 AI Platform for PE Teachers`;
  } else if (pageTitlePart.includes(prefix) || pageTitlePart.includes('Smart PE India')) {
    fullTitle = pageTitlePart;
  } else {
    fullTitle = `${prefix} | ${pageTitlePart}`;
  }

  // Update browser document.title for instant feedback during navigation
  useEffect(() => {
    if (fullTitle) {
      document.title = fullTitle;
    }
  }, [fullTitle]);

  // Determine Meta Description
  const metaDescription = customDescription || routeOverride.description || config.metaDescription;

  // Determine Keywords
  const keywords = routeOverride.keywords 
    ? `${routeOverride.keywords}, ${config.keywords}`
    : config.keywords;

  // Determine Social OG Tags
  const ogTitle = routeOverride.ogTitle || pageTitlePart || config.socialTitle || fullTitle;
  const ogDescription = routeOverride.ogDescription || metaDescription || config.socialDescription;
  const ogImage = routeOverride.ogImage || config.socialImageUrl;

  // Determine Crawling Robots: strictly disallow indexing of private student/school dashboards
  const isPrivateTab = [
    'school-students', 
    'school-results', 
    'school-admin', 
    'logs', 
    'fitness-reports', 
    'school-teams'
  ].includes(activeTab);

  const robotsSetting = (!isPrivateTab && config.allowCrawling) ? 'index, follow' : 'noindex, nofollow';

  // Dynamic Schema.org structured data based on route
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://smartpeindia.app/#organization",
        "name": "SmartPE India",
        "url": "https://smartpeindia.app/",
        "logo": {
          "@type": "ImageObject",
          "url": "https://smartpeindia.app/logo.png"
        },
        "description": "Physical Education Software and Sports Management Platform for Indian Schools."
      },
      {
        "@type": "WebSite",
        "@id": "https://smartpeindia.app/#website",
        "url": "https://smartpeindia.app/",
        "name": "SmartPE India",
        "description": "Physical Education Software for Indian Schools",
        "publisher": {
          "@id": "https://smartpeindia.app/#organization"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://smartpeindia.app/#software",
        "name": "SmartPE India",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "All",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR"
        },
        "description": "Physical education management system for Indian schools to plan PE lessons, track student fitness, conduct Khelo India assessments, and manage PE department records."
      },
      ...(cleanSubPath ? [{
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://smartpeindia.app/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": fullTitle,
            "item": canonicalFullUrl
          }
        ]
      }] : [])
    ]
  };

  return (
    <Helmet>
      {/* Title */}
      <title>{fullTitle}</title>

      {/* Basic Meta Tags */}
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={config.author || 'SmartPE India'} />
      <meta name="robots" content={robotsSetting} />
      <meta name="googlebot" content={robotsSetting} />

      {/* Canonical Link */}
      <link rel="canonical" href={canonicalFullUrl} />

      {/* Favicon & Brand Icons for Google Search & Browsers */}
      <link rel="shortcut icon" href="/favicon.ico" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
      <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
      <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="theme-color" content="#0D2B52" />

      {/* Open Graph / Facebook / WhatsApp Tags */}
      <meta property="og:site_name" content={config.siteName || 'SmartPE India'} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:image" content={ogImage || 'https://smartpeindia.app/logo.png'} />
      <meta property="og:url" content={canonicalFullUrl} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={config.twitterHandle || '@smartpeindia'} />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      <meta name="twitter:image" content={ogImage || 'https://smartpeindia.app/logo.png'} />

      {/* Structured Data JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default SEOHead;
