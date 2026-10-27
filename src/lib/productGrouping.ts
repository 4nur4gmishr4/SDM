import type { Product, ProductVariant } from '../types/product';

/**
 * Extracts numeric weight/volume value in grams/ml for sorting variants from smallest to largest
 */
export function getUnitWeight(unit?: string | null): number {
  if (!unit) return 999999;
  const u = unit.toLowerCase().trim();
  const numMatch = u.match(/(\d+(?:\.\d+)?)/);
  if (!numMatch) return 999999;
  const num = parseFloat(numMatch[1]);
  if (u.includes('kg')) return num * 1000;
  if (u.includes('l') || u.includes('lt')) return num * 1000;
  if (u.includes('g') || u.includes('gm')) return num;
  if (u.includes('ml')) return num;
  return num;
}

/**
 * Validates whether a unit string is valid retail packaging, discarding POS typos / junk codes
 */
export function isJunkUnit(rawUnit?: string | null): boolean {
  if (!rawUnit) return true;
  const u = rawUnit.trim().toLowerCase();
  if (!u || u === '.' || u === '-' || u === 'j' || u === 'o' || u === 'p' || u === 'g' || u === 'pck' || u === 'd') return true;
  if (/^\d+$/.test(u)) return true; // bare digit "1", "2"
  if (/^\d+\/-$/.test(u)) return true; // price entered as unit "20/-"
  if (/^\d+\s*pc$/i.test(u) && parseInt(u) > 12) return true; // "14 pc"
  return false;
}

/**
 * Normalizes a raw unit/pack string into clean display format (e.g. "100 g", "1 kg", "500 ml")
 */
export function normalizeUnit(rawUnit?: string | null): string {
  if (!rawUnit || isJunkUnit(rawUnit)) return 'Standard';
  let u = rawUnit.trim().replace(/^[\s(]+|[\s)]+$/g, '');
  if (!u || u === '.' || u === '-') return 'Standard';

  // Format common units cleanly
  u = u.replace(/^(\d+(?:\.\d+)?)\s*k(?:g|ilo)?$/i, '$1 kg');
  u = u.replace(/^(\d+(?:\.\d+)?)\s*g(?:m|ram|rams)?$/i, '$1 g');
  u = u.replace(/^(\d+(?:\.\d+)?)\s*l(?:tr|iter|itre|t)?$/i, '$1 L');
  u = u.replace(/^(\d+(?:\.\d+)?)\s*ml$/i, '$1 ml');
  u = u.replace(/^(\d+)\s*p(?:c|cs|k|ck|ack)?$/i, '$1 pc');
  return u;
}

/**
 * Extracts physical weight/volume in grams or milliliters for clustering shrinkflation variants
 */
function parsePhysicalWeight(unitStr?: string | null): number | null {
  if (!unitStr || isJunkUnit(unitStr)) return null;
  const u = unitStr.toLowerCase().trim();

  const kgMatch = u.match(/(\d+(?:\.\d+)?)\s*k(?:g|ilo)?\b/);
  if (kgMatch) return parseFloat(kgMatch[1]) * 1000;

  const gMatch = u.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|gms|gram|grams)\b/);
  if (gMatch) return parseFloat(gMatch[1]);

  const lMatch = u.match(/(\d+(?:\.\d+)?)\s*(?:l|lt|ltr|liter|litre)\b/);
  if (lMatch) return parseFloat(lMatch[1]) * 1000;

  const mlMatch = u.match(/(\d+(?:\.\d+)?)\s*ml\b/);
  if (mlMatch) return parseFloat(mlMatch[1]);

  const packMatch = u.match(/(\d+)\s*(?:pack|pcs|pc|p)\b/);
  if (packMatch) {
    const cnt = parseInt(packMatch[1]);
    if (cnt > 12) return null;
    return cnt * 70; // approximate multiplier for packs
  }

  return null;
}

/**
 * Extracts the clean base product name and the unit size
 */
export function extractBaseNameAndUnit(product: Product): { baseName: string; unitSize: string } {
  const fullName = (product.name || '').trim();
  
  // 1. Check for trailing bracket: "Brand Name Variant (100 g)"
  const bracketMatch = fullName.match(/\s*\(([^)]+)\)\s*$/);
  if (bracketMatch && bracketMatch.index !== undefined) {
    const baseName = fullName.slice(0, bracketMatch.index).trim();
    const unitSize = normalizeUnit(bracketMatch[1]);
    return { baseName, unitSize };
  }

  // 2. Fallback to product.unit_size
  const unitSize = normalizeUnit(product.unit_size);
  return { baseName: fullName, unitSize };
}

/**
 * Groups an array of raw database Products into consolidated multi-variant Product objects.
 * Guarantees at most 3-4 clean, distinct, verified pack-size options per product card,
 * with strict price monotonicity (smaller pack price <= larger pack price).
 */
export function groupProductsIntoVariants(products: Product[], requestedProductId?: string): Product[] {
  if (!products || products.length === 0) return [];

  interface CandidateItem {
    product: Product;
    grams: number | null;
    cleanUnit: string;
  }

  const groups = new Map<string, {
    baseProduct: Product;
    baseName: string;
    brand: string;
    candidates: CandidateItem[];
  }>();

  for (const product of products) {
    const { baseName, unitSize } = extractBaseNameAndUnit(product);
    const brand = (product.brand || '').toLowerCase().trim();
    const key = `${brand}:::${baseName.toLowerCase()}`;

    const grams = parsePhysicalWeight(unitSize);

    if (!groups.has(key)) {
      groups.set(key, {
        baseProduct: {
          ...product,
          name: baseName,
          unit_size: unitSize,
        },
        baseName,
        brand: product.brand || '',
        candidates: [],
      });
    }

    groups.get(key)!.candidates.push({
      product,
      grams,
      cleanUnit: unitSize,
    });
  }

  const groupedProducts: Product[] = [];

  for (const group of groups.values()) {
    const { baseProduct, baseName, candidates } = group;

    // Filter out invalid items and obvious price anomalies
    const validCandidates = candidates.filter(({ product, grams }) => {
      if (grams !== null) {
        // Discard tiny weights (< 25g) for standard packed FMCG goods (biscuits, noodles, flour, soaps)
        // Only spices, saffron, and condiments have genuine < 25g retail packs
        const isMicroItem = /heeng|hing|kesar|saffron|cardamom|elaichi|elichi|clove|laung|seasoning|masala-e-magic/i.test(baseName);
        if (!isMicroItem && grams < 25) return false;

        // If noodles, reject sample sachets < 50g and absurd price rates (> 50 rs per 100g)
        if (/noodle/i.test(baseName)) {
          if (grams < 50) return false;
          if ((product.price / grams) * 100 > 50) return false;
        }
      }
      return product.price > 0 && !isJunkUnit(product.unit_size);
    });

    if (validCandidates.length === 0) {
      // Fallback: use first candidate as single product
      const fallback = candidates[0].product;
      groupedProducts.push(fallback);
      continue;
    }

    // Sort valid candidates by grams (or price if grams not available)
    validCandidates.sort((a, b) => {
      if (a.grams !== null && b.grams !== null) return a.grams - b.grams;
      return a.product.price - b.product.price;
    });

    // Cluster near-identical weights within ±22% threshold
    const clusters: { totalGrams: number; items: CandidateItem[] }[] = [];
    const nonGramItems: CandidateItem[] = [];

    for (const cand of validCandidates) {
      if (cand.grams === null) {
        nonGramItems.push(cand);
        continue;
      }

      let matchedCluster = null;
      for (const cl of clusters) {
        const avg = cl.totalGrams / cl.items.length;
        if (Math.abs(cand.grams - avg) / avg <= 0.22) {
          matchedCluster = cl;
          break;
        }
      }

      if (matchedCluster) {
        matchedCluster.items.push(cand);
        matchedCluster.totalGrams += cand.grams;
      } else {
        clusters.push({ totalGrams: cand.grams, items: [cand] });
      }
    }

    // Select single best representative for each physical cluster
    const clusterReps: ProductVariant[] = [];

    for (const cl of clusters) {
      cl.items.sort((a, b) => {
        // Priority 1: Requested product ID
        if (requestedProductId) {
          if (a.product.id === requestedProductId) return -1;
          if (b.product.id === requestedProductId) return 1;
        }
        // Priority 2: Primary store catalog SKU (< 15000)
        const aSku = parseInt(a.product.sku?.replace(/\D/g, '') || '999999');
        const bSku = parseInt(b.product.sku?.replace(/\D/g, '') || '999999');
        if (aSku < 15000 && bSku >= 15000) return -1;
        if (bSku < 15000 && aSku >= 15000) return 1;

        // Priority 3: Verified image
        if (a.product.image_url && !b.product.image_url) return -1;
        if (!a.product.image_url && b.product.image_url) return 1;

        // Priority 4: Available stock
        if (a.product.is_available && !b.product.is_available) return -1;
        if (!a.product.is_available && b.product.is_available) return 1;

        return (a.product.price || 0) - (b.product.price || 0);
      });

      const best = cl.items[0];
      const grams = best.grams!;
      let displayUnit = best.cleanUnit;

      // Clean format canonical unit
      if (grams >= 1000) {
        displayUnit = `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 1)} kg`;
      } else {
        displayUnit = `${Math.round(grams)} g`;
      }

      clusterReps.push({
        id: best.product.id,
        unit_size: displayUnit,
        price: best.product.price,
        mrp: best.product.mrp,
        stock_quantity: best.product.stock_quantity,
        is_available: best.product.is_available,
        sku: best.product.sku,
        image_url: best.product.image_url,
      });
    }

    // Only append non-gram items if there are no physical weight clusters
    if (clusters.length === 0) {
      for (const ng of nonGramItems) {
        clusterReps.push({
          id: ng.product.id,
          unit_size: ng.cleanUnit,
          price: ng.product.price,
          mrp: ng.product.mrp,
          stock_quantity: ng.product.stock_quantity,
          is_available: ng.product.is_available,
          sku: ng.product.sku,
          image_url: ng.product.image_url,
        });
      }
    }

    // Sort variants by physical weight then price
    clusterReps.sort((a, b) => {
      const wA = getUnitWeight(a.unit_size);
      const wB = getUnitWeight(b.unit_size);
      if (wA !== wB) return wA - wB;
      return a.price - b.price;
    });

    // Enforce strict price monotonicity: smaller weight variant price <= larger weight variant price
    const monotonicVariants: ProductVariant[] = [];
    let minPrice = 0;
    for (const v of clusterReps) {
      if (v.price >= minPrice) {
        monotonicVariants.push(v);
        minPrice = v.price;
      }
    }

    // Cap variants to at most 3 (or max 4) standard options (e.g. Small, Medium, Large)
    let finalVariants = monotonicVariants;
    if (finalVariants.length > 3) {
      if (finalVariants.length === 4) {
        // Keep all 4 if exactly 4
      } else {
        // Sample 3 clean options (Small, Medium, Large)
        const first = finalVariants[0];
        const mid = finalVariants[Math.floor(finalVariants.length / 2)];
        const last = finalVariants[finalVariants.length - 1];
        finalVariants = [first, mid, last];
      }
    }

    // Pick active default variant
    let defaultVariant = requestedProductId 
      ? finalVariants.find(v => v.id === requestedProductId)
      : undefined;

    if (!defaultVariant) {
      defaultVariant = finalVariants.find(v => v.is_available) || finalVariants[0];
    }

    // Upgrade baseProduct image if any variant has an image
    const variantWithImage = finalVariants.find(v => v.image_url);
    const finalImage = defaultVariant.image_url || baseProduct.image_url || variantWithImage?.image_url || null;

    groupedProducts.push({
      ...baseProduct,
      id: defaultVariant.id,
      price: defaultVariant.price,
      mrp: defaultVariant.mrp,
      unit_size: defaultVariant.unit_size,
      image_url: finalImage,
      is_available: finalVariants.some(v => v.is_available),
      variants: finalVariants.length > 1 ? finalVariants : undefined,
    });
  }

  return groupedProducts;
}
