import type { DeliveryLocation, GeocodingSearchResult } from '../types/location';

export const DEFAULT_JABALPUR_LOCATION: DeliveryLocation = {
  lat: Number(import.meta.env.VITE_STORE_DEFAULT_LAT) || 23.1685,
  lng: Number(import.meta.env.VITE_STORE_DEFAULT_LNG) || 79.9550,
  address: (import.meta.env.VITE_STORE_DEFAULT_ADDRESS as string) || 'Sai Darshan Shopping Mart, 1117 Sanjeevni Nagar Main Road, Jabalpur',
  area: (import.meta.env.VITE_STORE_DEFAULT_AREA as string) || 'Sanjeevni Nagar',
  city: (import.meta.env.VITE_STORE_DEFAULT_CITY as string) || 'Jabalpur',
  pincode: (import.meta.env.VITE_STORE_DEFAULT_PINCODE as string) || '482003',
  formattedAddress: (import.meta.env.VITE_STORE_DEFAULT_FORMATTED_ADDRESS as string) || '1117 Sanjeevni Nagar Main Road, Jabalpur, Madhya Pradesh 482003',
  isCustom: false,
};

/**
 * 100% Free Google-Grade Reverse Geocoding.
 * Uses ArcGIS World Geocode API as primary (0 cost, no API keys, zero rate-limit blocks, full browser CORS)
 * with BigDataCloud and OpenStreetMap as resilient fallbacks.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<DeliveryLocation> {
  // 1. Primary provider: ArcGIS World Geocode (Fastest, ultra-reliable, zero-key, full CORS)
  try {
    const arcgisUrl = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=${lng},${lat}&f=json`;
    const res = await fetch(arcgisUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const a = data.address;
        const area = a.Neighborhood || a.ShortLabel || a.Subregion || 'Jabalpur';
        const city = a.City || 'Jabalpur';
        const pincode = a.Postal || '482001';
        const formatted = a.Match_addr || `${area}, ${city} ${pincode}`;

        return {
          lat,
          lng,
          address: a.ShortLabel || area,
          area: area || 'Jabalpur',
          city: city || 'Jabalpur',
          pincode,
          formattedAddress: formatted,
          isCustom: true,
        };
      }
    }
  } catch (err) {
    console.warn('ArcGIS reverse geocode failed, trying BigDataCloud fallback:', err);
  }

  // 2. Fallback provider: BigDataCloud Free Client Reverse Geocoding API
  try {
    const fallbackUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(fallbackUrl);
    if (res.ok) {
      const data = await res.json();
      const area = data.locality || data.principalSubdivision || 'Jabalpur';
      const city = data.city || 'Jabalpur';
      const pincode = data.postcode || '482001';

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
    console.warn('BigDataCloud reverse geocode failed, trying Nominatim:', err);
  }

  // 3. Fallback: OpenStreetMap Nominatim
  try {
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
        'Jabalpur';
      const city = addr.city || addr.town || 'Jabalpur';
      const pincode = addr.postcode || '482001';
      const shortAddress = addr.road && area !== addr.road ? `${addr.road}, ${area}` : area;
      const formatted = data.display_name
        ? data.display_name.split(',').slice(0, 4).join(',').trim()
        : `${shortAddress}, ${city} ${pincode}`.trim();

      return {
        lat,
        lng,
        address: shortAddress,
        area: area || 'Jabalpur',
        city: city || 'Jabalpur',
        pincode,
        formattedAddress: formatted,
        isCustom: true,
      };
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode failed:', err);
  }

  // Safe default fallback
  return {
    lat,
    lng,
    address: `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    area: 'Jabalpur Area',
    city: 'Jabalpur',
    pincode: '482001',
    formattedAddress: `Delivery Location (${lat.toFixed(4)}, ${lng.toFixed(4)}), Jabalpur`,
    isCustom: true,
  };
}

// Curated Jabalpur Localities & Landmarks for instant 0ms offline suggestions
const JABALPUR_LOCAL_PLACES: Array<{ name: string; area: string; lat: number; lng: number }> = [
  { name: 'Sai Darshan Shopping Mart, Sanjeevni Nagar', area: 'Sanjeevni Nagar', lat: 23.1685, lng: 79.9550 },
  { name: 'Civil Lines', area: 'Civil Lines', lat: 23.1646, lng: 79.9554 },
  { name: 'Wright Town', area: 'Wright Town', lat: 23.1669, lng: 79.9255 },
  { name: 'Napier Town', area: 'Napier Town', lat: 23.1685, lng: 79.9550 },
  { name: 'Vijay Nagar', area: 'Vijay Nagar', lat: 23.1892, lng: 79.9040 },
  { name: 'Madan Mahal', area: 'Madan Mahal', lat: 23.1520, lng: 79.9140 },
  { name: 'Gorakhpur', area: 'Gorakhpur', lat: 23.1538, lng: 79.9319 },
  { name: 'Sadar Bazar / Cantt', area: 'Sadar', lat: 23.1535, lng: 79.9494 },
  { name: 'Russell Chowk', area: 'Russell Chowk', lat: 23.1680, lng: 79.9380 },
  { name: 'Golbazar', area: 'Golbazar', lat: 23.1657, lng: 79.9324 },
  { name: 'Garha', area: 'Garha', lat: 23.1560, lng: 79.8970 },
  { name: 'South Civil Lines', area: 'South Civil Lines', lat: 23.1590, lng: 79.9580 },
  { name: 'Ghamapur', area: 'Ghamapur', lat: 23.1810, lng: 79.9580 },
  { name: 'Adhartal', area: 'Adhartal', lat: 23.2080, lng: 79.9450 },
  { name: 'Ranjhi', area: 'Ranjhi', lat: 23.2030, lng: 80.0003 },
  { name: 'Tilhari', area: 'Tilhari', lat: 23.1290, lng: 79.9720 },
  { name: 'Bilhari', area: 'Bilhari', lat: 23.1380, lng: 79.9650 },
  { name: 'Dhanvantri Nagar', area: 'Dhanvantri Nagar', lat: 23.1620, lng: 79.8820 },
  { name: 'Katanga', area: 'Katanga', lat: 23.1470, lng: 79.9290 },
  { name: 'Hathital', area: 'Hathital', lat: 23.1580, lng: 79.9270 },
  { name: 'Rampur', area: 'Rampur', lat: 23.1410, lng: 79.9250 },
  { name: 'Gupteshwar', area: 'Gupteshwar', lat: 23.1490, lng: 79.9150 },
  { name: 'Gwarighat', area: 'Gwarighat', lat: 23.1200, lng: 79.9350 },
  { name: 'Shastri Bridge', area: 'Shastri Bridge', lat: 23.1700, lng: 79.9400 },
  { name: 'Jabalpur Railway Station', area: 'Station Road', lat: 23.1710, lng: 79.9510 },
  { name: 'High Court Jabalpur', area: 'Civil Lines', lat: 23.1680, lng: 79.9520 },
  { name: 'Karmeta', area: 'Karmeta', lat: 23.2200, lng: 79.9100 },
  { name: 'Suhagi', area: 'Suhagi', lat: 23.2350, lng: 79.9550 },
  { name: 'Maharajpur', area: 'Maharajpur', lat: 23.2450, lng: 79.9400 },
  { name: 'Bhedaghat', area: 'Bhedaghat', lat: 23.1310, lng: 79.8000 },
];

/**
 * 100% Free Locality & Landmark Search.
 * Combines instant local Jabalpur landmark matching with live ArcGIS World Geocode candidate lookups.
 * Zero API keys, zero rate-limit blocks, full browser CORS compatibility.
 */
export async function searchPlaces(query: string): Promise<GeocodingSearchResult[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) return [];

  const results: GeocodingSearchResult[] = [];

  // 1. Instant local matches (0ms latency)
  const localMatches = JABALPUR_LOCAL_PLACES.filter((p) =>
    p.name.toLowerCase().includes(trimmed) || p.area.toLowerCase().includes(trimmed)
  );

  for (const match of localMatches) {
    results.push({
      label: `${match.name}, Jabalpur`,
      lat: match.lat,
      lng: match.lng,
      area: match.area,
      city: 'Jabalpur',
    });
  }

  // 2. Live ArcGIS World Geocode API (free REST, CORS enabled)
  try {
    const searchQuery = trimmed.includes('jabalpur') ? trimmed : `${trimmed}, Jabalpur`;
    const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=${encodeURIComponent(
      searchQuery
    )}&f=json&location=79.9550,23.1685&distance=30000&maxLocations=6`;

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.candidates && Array.isArray(data.candidates)) {
        for (const c of data.candidates) {
          if (!c.location || !c.address) continue;
          // Avoid near duplicates
          const isDup = results.some(
            (r) =>
              Math.abs(r.lat - c.location.y) < 0.003 &&
              Math.abs(r.lng - c.location.x) < 0.003
          );
          if (!isDup) {
            results.push({
              label: c.address,
              lat: c.location.y,
              lng: c.location.x,
              area: c.address.split(',')[0].trim(),
              city: 'Jabalpur',
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Live geocode search failed, using local matches:', err);
  }

  return results.slice(0, 8);
}

/**
 * Generates direct Google Maps Navigation Link for WhatsApp & Delivery Partner.
 */
export function getGoogleMapsNavigationUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
