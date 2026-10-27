import { Helmet } from 'react-helmet-async';
import { STORE_NAME, STORE_ADDRESS, STORE_PHONE_NUMBER } from '../../lib/orderUtils';

interface SeoHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  imageUrl?: string;
  type?: 'website' | 'article' | 'product';
  jsonLdSchema?: Record<string, any>;
}

const BASE_URL = 'https://saidarshanmart.com';

export function SeoHead({
  title,
  description,
  canonicalUrl,
  imageUrl,
  type = 'website',
  jsonLdSchema,
}: SeoHeadProps) {
  const fullCanonical = canonicalUrl ? `${BASE_URL}${canonicalUrl}` : BASE_URL;
  const ogImage = imageUrl || `${BASE_URL}/pwa-512x512.png`;

  // Default LocalBusiness Schema for Google
  const defaultSchema = {
    '@context': 'https://schema.org',
    '@type': ['GroceryStore', 'Supermarket'],
    name: STORE_NAME,
    legalName: 'M/S. SAI DARSHAN SHOPPING MART',
    slogan: 'There is only one Boss: The Customer.',
    alternateName: ['Sai Darshan Shopping Mart Jabalpur', 'SDSM Jabalpur', 'Supermarket Near Me Jabalpur'],
    description: 'Jabalpur premier supermarket for daily groceries, dry fruits, atta, dals, spices, and fast doorstep delivery. There is only one Boss: The Customer.',
    image: 'https://otyojqnnwbrteknyqcpi.supabase.co/storage/v1/object/public/store-media/banners/Logo.png',
    '@id': `${BASE_URL}/#store`,
    url: BASE_URL,
    telephone: STORE_PHONE_NUMBER,
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, UPI, Google Pay, PhonePe, Paytm, BHIM, Cards',
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      streetAddress: STORE_ADDRESS,
      addressLocality: 'Jabalpur',
      postalCode: '482003',
      addressRegion: 'Madhya Pradesh',
      addressCountry: 'IN'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 23.1685,
      longitude: 79.9550
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
      ],
      opens: '08:00',
      closes: '22:30'
    }
  };

  const finalSchema = jsonLdSchema 
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          defaultSchema,
          jsonLdSchema
        ]
      }
    : defaultSchema;

  return (
    <Helmet>
      {/* Basic HTML Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      {canonicalUrl && <link rel="canonical" href={fullCanonical} />}

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={STORE_NAME} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullCanonical} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />

      {/* Advanced SEO: JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalSchema)}
      </script>
    </Helmet>
  );
}
