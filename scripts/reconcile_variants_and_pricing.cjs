const { createClient } = require('@supabase/supabase-js');

// Parse unit size and extract numeric quantity & unit type
function parseUnit(name, unitSize) {
  const combined = `${name || ''} ${unitSize || ''}`.toLowerCase();

  // 1. Kg
  const kgMatch = combined.match(/(\d+(?:\.\d+)?)\s*k(?:g|ilo)?\b/);
  if (kgMatch) return { value: parseFloat(kgMatch[1]), type: 'kg', grams: parseFloat(kgMatch[1]) * 1000, display: `${parseFloat(kgMatch[1])} kg` };

  // 2. Grams
  const gMatch = combined.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|gms|gram|grams)\b/);
  if (gMatch) return { value: parseFloat(gMatch[1]), type: 'g', grams: parseFloat(gMatch[1]), display: `${parseFloat(gMatch[1])} g` };

  // 3. Litre
  const lMatch = combined.match(/(\d+(?:\.\d+)?)\s*(?:l|lt|ltr|liter|litre)\b/);
  if (lMatch) return { value: parseFloat(lMatch[1]), type: 'L', grams: parseFloat(lMatch[1]) * 1000, display: `${parseFloat(lMatch[1])} L` };

  // 4. Millilitre
  const mlMatch = combined.match(/(\d+(?:\.\d+)?)\s*ml\b/);
  if (mlMatch) return { value: parseFloat(mlMatch[1]), type: 'ml', grams: parseFloat(mlMatch[1]), display: `${parseFloat(mlMatch[1])} ml` };

  // 5. Pack / Pcs
  const packMatch = combined.match(/(\d+)\s*(?:pack|pcs|pc|p)\b/);
  if (packMatch) return { value: parseInt(packMatch[1]), type: 'pc', grams: parseInt(packMatch[1]) * 70, display: `${parseInt(packMatch[1])} Pack` };

  return null;
}

// Check if a unit or name is garbage
function isGarbageUnit(name, unitSize) {
  const u = (unitSize || '').trim().toLowerCase();
  if (!u || u === '.' || u === '-' || u === 'j' || u === 'o' || u === 'p' || u === 'g' || u === 'pck' || u === 'd') return true;
  if (/^\d+$/.test(u)) return true; // bare number like "1", "2", "6"
  if (/^\d+\/-$/.test(u)) return true; // "20/-"
  if (/^\d+\s*pack$/i.test(u) && parseInt(u) > 12) return true; // e.g. "20 pack" or "30 pack" when it actually meant ₹20 or ₹30 price!
  return false;
}

// Extract base name without size in bracket
function getBaseName(fullName) {
  return (fullName || '')
    .replace(/\s*\([^)]+\)\s*$/, '')
    .replace(/\s+\d+(\.\d+)?\s*(g|gm|kg|ml|l|ltr|pcs|pack)\b.*$/i, '')
    .trim();
}

async function run() {
  const { getSupabaseAdminConfig } = await import('./env_loader.js');
  const { supabaseUrl, supabaseKey } = getSupabaseAdminConfig();
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('⚡ Starting Variant & Pricing Consistency Reconciler...');

  // 1. Fetch all active products
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, brand, unit_size, price, mrp, image_url, is_available, is_featured, is_archived')
      .eq('is_archived', false)
      .range(from, from + 999);

    if (error) {
      console.error('Fetch error:', error.message);
      break;
    }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }

  console.log(`Loaded ${all.length} active products from database.`);

  // Group by brand + baseName
  const groups = new Map();
  for (const p of all) {
    const baseName = getBaseName(p.name);
    const brand = (p.brand || '').trim().toLowerCase();
    const key = `${brand}:::${baseName.toLowerCase()}`;

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }

  console.log(`Identified ${groups.size} unique base product groups.`);

  let totalToArchive = [];

  for (const [, items] of groups.entries()) {
    if (items.length <= 1) continue;

    // Separate valid items from junk
    const validItems = [];
    const junkItems = [];

    for (const item of items) {
      if (isGarbageUnit(item.name, item.unit_size)) {
        junkItems.push(item);
        continue;
      }
      const parsed = parseUnit(item.name, item.unit_size);
      if (!parsed) {
        // If it has no parsed unit but has another item that does, treat as junk
        junkItems.push(item);
        continue;
      }
      validItems.push({
        ...item,
        parsed,
      });
    }

    if (validItems.length === 0) {
      // Keep best 1 item
      items.sort((a, b) => (b.image_url ? 1 : 0) - (a.image_url ? 1 : 0));
      for (let i = 1; i < items.length; i++) {
        totalToArchive.push(items[i].id);
      }
      continue;
    }

    // Sort valid items by physical weight (grams)
    validItems.sort((a, b) => a.parsed.grams - b.parsed.grams);

    // Cluster near-identical weights (within 20% of each other) into canonical tiers
    const clusters = [];
    for (const item of validItems) {
      let matchedCluster = null;
      for (const cl of clusters) {
        const clusterAvg = cl.totalGrams / cl.items.length;
        const diffRatio = Math.abs(item.parsed.grams - clusterAvg) / clusterAvg;
        if (diffRatio <= 0.22 && item.parsed.type === cl.type) {
          matchedCluster = cl;
          break;
        }
      }

      if (matchedCluster) {
        matchedCluster.items.push(item);
        matchedCluster.totalGrams += item.parsed.grams;
      } else {
        clusters.push({
          type: item.parsed.type,
          totalGrams: item.parsed.grams,
          items: [item],
        });
      }
    }

    // From each cluster, pick the single BEST representative
    const cleanVariants = [];
    for (const cl of clusters) {
      // Sort cluster items: prefer image, non-zero price, authentic MRP
      cl.items.sort((a, b) => {
        if (a.image_url && !b.image_url) return -1;
        if (!a.image_url && b.image_url) return 1;
        if (a.price > 0 && b.price <= 0) return -1;
        if (b.price > 0 && a.price <= 0) return 1;
        return (a.price || 0) - (b.price || 0);
      });

      const best = cl.items[0];
      cleanVariants.push(best);

      // All other duplicate rows in this cluster get archived
      for (let i = 1; i < cl.items.length; i++) {
        totalToArchive.push(cl.items[i].id);
      }
    }

    // Also archive all junk items
    junkItems.forEach(j => totalToArchive.push(j.id));

    // Sort clean variants by weight
    cleanVariants.sort((a, b) => a.parsed.grams - b.parsed.grams);

    // Enforce pricing consistency: smaller size price MUST be <= larger size price
    // If a smaller size has price > larger size (pricing inversion anomaly), fix or archive the anomaly
    const saneVariants = [];
    let prevPrice = 0;
    for (const v of cleanVariants) {
      if (v.price < prevPrice) {
        // Price inversion! E.g. 70g has price 80, but 280g has price 57.
        // If price is higher than the larger pack, it's corrupt -> archive it
        totalToArchive.push(v.id);
      } else {
        saneVariants.push(v);
        prevPrice = v.price;
      }
    }

    // Keep at most 3 to 4 distinct variants per product group (matching user's request)
    if (saneVariants.length > 4) {
      // Pick first (small), middle, and last (family/bulk)
      const selected = [
        saneVariants[0],
        saneVariants[Math.floor(saneVariants.length / 3)],
        saneVariants[Math.floor((saneVariants.length * 2) / 3)],
        saneVariants[saneVariants.length - 1],
      ];
      const selectedIds = new Set(selected.map(s => s.id));
      for (const v of saneVariants) {
        if (!selectedIds.has(v.id)) {
          totalToArchive.push(v.id);
        }
      }
    }
  }

  console.log(`\n=== Reconcile Summary ===`);
  console.log(`Rows identified to archive (junk/duplicate/anomalous variants): ${totalToArchive.length}`);
  console.log(`Remaining clean active products: ${all.length - totalToArchive.length}`);

  // Test Maggi specifically to show before and after
  console.log('\n--- Checking Maggi after proposed reconciliation ---');
  const maggiArchivedSet = new Set(totalToArchive);
  const remainingMaggi = all.filter(p => /maggi/i.test(p.name) && !maggiArchivedSet.has(p.id));
  console.log(`Remaining active Maggi products: ${remainingMaggi.length}`);
  remainingMaggi.forEach(m => console.log('  ', m.sku, '|', m.name, '| Unit:', m.unit_size, '| Price: ₹' + m.price, '| MRP: ₹' + m.mrp));
}

run().catch(console.error);
