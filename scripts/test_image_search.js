import https from 'https';

async function searchProductImage(query) {
  try {
    // 1. First check Open Food Facts (fast, high quality, free grocery database)
    const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=1`;
    const offRes = await fetch(offUrl, { headers: { 'User-Agent': 'SaiDarshanMart/1.0' } });
    if (offRes.ok) {
      const offData = await offRes.json();
      const product = offData.products?.[0];
      const img = product?.image_front_url || product?.image_url || product?.image_small_url;
      if (img) return { source: 'openfoodfacts', url: img };
    }
  } catch (e) {
    // ignore
  }

  // 2. Fallback to DuckDuckGo Images
  try {
    const q = `${query} grocery india`;
    const step1 = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(q)}`);
    const html = await step1.text();
    const match = html.match(/vqd=([0-9-]+)/) || html.match(/vqd=['"]([0-9-]+)['"]/);
    if (match && match[1]) {
      const vqd = match[1];
      const step2 = await fetch(`https://duckduckgo.com/i.js?l=in-en&o=json&q=${encodeURIComponent(q)}&vqd=${vqd}&f=,,,type:photo,`);
      if (step2.ok) {
        const json = await step2.json();
        const first = json.results?.find(r => r.image && !r.image.includes('.svg'));
        if (first?.image) return { source: 'duckduckgo', url: first.image };
      }
    }
  } catch (e) {
    // ignore
  }

  return null;
}

const testQueries = [
  'ATTA RUSK 375GM',
  'ATTA NOODLES MAGGI 290GM',
  'BRITANNIA 50-50 maska chaska',
  'Cadbury Bournvita 500G',
  'Fortune Sunlite Refined Sunflower Oil 1L'
];

for (const q of testQueries) {
  const result = await searchProductImage(q);
  console.log(`Query: "${q}" =>`, result);
}
