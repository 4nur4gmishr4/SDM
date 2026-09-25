import type { DeliveryLocation, GeocodingSearchResult } from '../types/location';

export const DEFAULT_JABALPUR_LOCATION: DeliveryLocation = {
  lat: 23.1685,
  lng: 79.9550,
  address: 'Sai Darshan Mart, Napier Town, Jabalpur',
  area: 'Napier Town',
  city: 'Jabalpur',
  pincode: '482001',
  formattedAddress: 'Napier Town, Jabalpur, Madhya Pradesh 482001',
  isCustom: false,
};

/**
 * 100% Free Reverse Geocoding using OpenStreetMap Nominatim with BigDataCloud fallback.
 * No API key, no credit card, zero cost.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<DeliveryLocation> {
  try {
    // 1. Primary provider: OpenStreetMap Nominatim
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetch(nominatimUrl, {
      headers: {
        'Accept-Language': 'en',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const area =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.road ||
        addr.commercial ||
        'Jabalpur';
      
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.county ||
        'Jabalpur';

      const pincode = addr.postcode || '';
      const road = addr.road || '';
      
      const shortAddress = road && area !== road ? `${road}, ${area}` : area;
      const formatted = data.display_name
        ? data.display_name.split(',').slice(0, 4).join(',').trim()
        : `${shortAddress}, ${city} ${pincode}`.trim();

      return {
        lat,
        lng,
        address: shortAddress,
        area: area || 'Current Location',
        city: city || 'Jabalpur',
        pincode,
        formattedAddress: formatted,
        isCustom: true,
      };
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode failed, trying fallback:', err);
  }

  // 2. Fallback provider: BigDataCloud Free Client Reverse Geocoding API
  try {
    const fallbackUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(fallbackUrl);
    if (res.ok) {
      const data = await res.json();
      const area = data.locality || data.principalSubdivision || 'Jabalpur';
      const city = data.city || 'Jabalpur';
      const pincode = data.postcode || '';

      return {
        lat,
        lng,
        address: area,
        area,
        city,
        pincode,
        formattedAddress: `${area}, ${city} ${pincode}`.trim(),
        isCustom: true,
      };
    }
  } catch (err) {
    console.warn('Fallback reverse geocode failed:', err);
  }

  // Safe fallback to coordinates with city name
  return {
    lat,
    lng,
    address: `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    area: 'Jabalpur Area',
    city: 'Jabalpur',
    pincode: '482001',
    formattedAddress: `Pinpointed Location (${lat.toFixed(4)}, ${lng.toFixed(4)}), Jabalpur`,
    isCustom: true,
  };
}

/**
 * 100% Free Locality / Landmark Search using OpenStreetMap Nominatim.
 */
export async function searchPlaces(query: string): Promise<GeocodingSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  try {
    // Bias search query towards Jabalpur, India
    const searchQuery = trimmed.toLowerCase().includes('jabalpur')
      ? trimmed
      : `${trimmed}, Jabalpur`;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      searchQuery
    )}&limit=6&countrycodes=in&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    return data.map((item: any) => {
      const addr = item.address || {};
      const area =
        addr.suburb ||
        addr.neighbourhood ||
        addr.road ||
        addr.village ||
        item.display_name.split(',')[0];

      return {
        label: item.display_name.split(',').slice(0, 3).join(',').trim(),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        area,
        city: addr.city || addr.town || 'Jabalpur',
      };
    });
  } catch (err) {
    console.warn('Place search failed:', err);
    return [];
  }
}

/**
 * Generates direct Google Maps Navigation Link for WhatsApp & Delivery Partner.
 */
export function getGoogleMapsNavigationUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
