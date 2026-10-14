import type { Product, ProductVariant } from '../types/product';

/**
 * Extracts numeric weight/volume value for sorting variants from smallest to largest
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
 * Normalizes a raw unit/pack string into clean display format (e.g. "100 g", "1 kg", "₹10 Pack")
 */
export function normalizeUnit(rawUnit?: string | null): string {
  if (!rawUnit) return 'Standard';
  let u = rawUnit.trim().replace(/^[\s(]+|[\s)]+$/g, '');
  if (!u || u === '.' || u === '-') return 'Standard';

  // Format common units
  u = u.replace(/^(\d+(?:\.\d+)?)\s*k(?:g|ilo)?$/i, '$1 kg');
  u = u.replace(/^(\d+(?:\.\d+)?)\s*g(?:m|ram|rams)?$/i, '$1 g');
  u = u.replace(/^(\d+(?:\.\d+)?)\s*l(?:tr|iter|itre|t)?$/i, '$1 L');
  u = u.replace(/^(\d+(?:\.\d+)?)\s*ml$/i, '$1 ml');
  u = u.replace(/^(\d+)\s*p(?:c|cs|k|ck|ack)?$/i, '$1 pc');
  return u;
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
 * Same products with different quantities (e.g. 100g, 250g, 500g, 1kg) will appear as ONE single card/widget
 * with interactive variant selectors!
 */
export function groupProductsIntoVariants(products: Product[], requestedProductId?: string): Product[] {
  if (!products || products.length === 0) return [];

  const groups = new Map<string, {
    baseProduct: Product;
    variantsMap: Map<string, ProductVariant>;
  }>();

  for (const product of products) {
    const { baseName, unitSize } = extractBaseNameAndUnit(product);
    // Key by brand + baseName (case-insensitive) to prevent cross-brand collisions
    const brand = (product.brand || '').toLowerCase().trim();
    const key = `${brand}:::${baseName.toLowerCase()}`;

    const variant: ProductVariant = {
      id: product.id,
      unit_size: unitSize,
      price: product.price,
      mrp: product.mrp,
      stock_quantity: product.stock_quantity,
      is_available: product.is_available,
      sku: product.sku,
      image_url: product.image_url,
    };

    if (!groups.has(key)) {
      // Clone base product
      const baseProduct: Product = {
        ...product,
        name: baseName, // Clean display name without bracketed size
        unit_size: unitSize,
      };
      const variantsMap = new Map<string, ProductVariant>();
      variantsMap.set(unitSize, variant);
      groups.set(key, { baseProduct, variantsMap });
    } else {
      const entry = groups.get(key)!;
      const existing = entry.variantsMap.get(unitSize);

      if (!existing) {
        entry.variantsMap.set(unitSize, variant);
      } else {
        // If this product matches the requested ID, it must take absolute priority
        if (product.id === requestedProductId) {
          entry.variantsMap.set(unitSize, variant);
        } else if (existing.id === requestedProductId) {
          // Keep requested product untouched
        } else {
          // Primary retail inventory deduplication:
          // 1. Primary catalog SKUs (< 15000) take precedence over historical dump SKUs (>= 15000)
          const newSkuNum = parseInt(product.sku?.replace(/\D/g, '') || '999999');
          const oldSkuNum = parseInt(existing.sku?.replace(/\D/g, '') || '999999');
          const newIsPrimary = newSkuNum < 15000;
          const oldIsPrimary = oldSkuNum < 15000;

          if (newIsPrimary && !oldIsPrimary) {
            entry.variantsMap.set(unitSize, variant);
          } else if (!newIsPrimary && oldIsPrimary) {
            // Keep existing primary
          } else if (product.image_url && !existing.image_url) {
            entry.variantsMap.set(unitSize, variant);
          } else if (product.is_available && !existing.is_available) {
            entry.variantsMap.set(unitSize, variant);
          } else if (product.is_available === existing.is_available) {
            // If both are in same catalog tier, prefer current active MRP/price (not expired zero/outdated rate)
            if ((product.mrp || 0) > (existing.mrp || 0) && product.price > 0) {
              entry.variantsMap.set(unitSize, variant);
            }
          }
        }
      }
      
      // If the base product didn't have an image but this variant does, upgrade image
      if (!entry.baseProduct.image_url && product.image_url) {
        entry.baseProduct.image_url = product.image_url;
      }
      
      // Prioritize featured status
      if (product.is_featured) {
        entry.baseProduct.is_featured = true;
      }
    }
  }

  // Convert groups into finalized Product objects
  const groupedProducts: Product[] = [];

  for (const { baseProduct, variantsMap } of groups.values()) {
    // If we have distinct physical pack sizes, filter out uninformative 'Standard'
    let cleanVariants = Array.from(variantsMap.values());
    if (cleanVariants.length > 1) {
      const realUnits = cleanVariants.filter(v => v.unit_size !== 'Standard');
      if (realUnits.length > 0) {
        cleanVariants = realUnits;
      }
    }

    // Sort variants logically from smallest to largest
    const sortedVariants = cleanVariants.sort(
      (a, b) => getUnitWeight(a.unit_size) - getUnitWeight(b.unit_size)
    );

    // Pick active default variant
    let defaultVariant = requestedProductId 
      ? sortedVariants.find(v => v.id === requestedProductId)
      : undefined;

    if (!defaultVariant) {
      defaultVariant = sortedVariants.find(v => v.is_available) || sortedVariants[0];
    }

    groupedProducts.push({
      ...baseProduct,
      id: defaultVariant.id, // Base product ID matches default variant for seamless navigation
      price: defaultVariant.price,
      mrp: defaultVariant.mrp,
      unit_size: defaultVariant.unit_size,
      image_url: defaultVariant.image_url || baseProduct.image_url,
      is_available: sortedVariants.some(v => v.is_available),
      variants: sortedVariants.length > 1 ? sortedVariants : undefined,
    });
  }

  return groupedProducts;
}
