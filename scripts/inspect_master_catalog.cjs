const fs = require('fs');

const data = JSON.parse(fs.readFileSync('main_data/MASTER_SAI_DARSHAN_CATALOG.json', 'utf-8'));
console.log('=== MASTER CATALOG AUDIT ===');
console.log('Total storefront items:', data.length);

const withImages = data.filter(p => p.image_url && typeof p.image_url === 'string' && p.image_url.startsWith('http')).length;
console.log('Items with verified image URLs:', withImages);

const maggi = data.filter(p => {
  const name = (p.name || '').toLowerCase();
  return name.includes('maggi') && (name.includes('noodle') || name.includes('2-min') || name.includes('masala'));
});

console.log('\n--- Maggi Products Sample ---');
maggi.slice(0, 5).forEach(m => {
  const varSummary = (m.variants || []).map(v => `${v.unit_size}: ₹${v.price} (MRP: ₹${v.mrp})`).join(' | ');
  console.log(`- [${m.sku}] ${m.name} | Base Pack: ${m.unit_size} | Rate: ₹${m.price} (MRP: ₹${m.mrp})`);
  if (varSummary) {
    console.log(`  Variants (${m.variants.length}): ${varSummary}`);
  }
});

const parle = data.filter(p => {
  const name = (p.name || '').toLowerCase();
  return name.includes('parle-g') || name.includes('parle g');
});

console.log('\n--- Parle-G Sample ---');
parle.slice(0, 4).forEach(p => {
  const varSummary = (p.variants || []).map(v => `${v.unit_size}: ₹${v.price} (MRP: ₹${v.mrp})`).join(' | ');
  console.log(`- [${p.sku}] ${p.name} | Base Pack: ${p.unit_size} | Rate: ₹${p.price} (MRP: ₹${p.mrp})`);
  if (varSummary) {
    console.log(`  Variants (${p.variants.length}): ${varSummary}`);
  }
});

const fortune = data.filter(p => {
  const name = (p.name || '').toLowerCase();
  return name.includes('fortune') && (name.includes('oil') || name.includes('soyabean'));
});

console.log('\n--- Fortune Oil Sample ---');
fortune.slice(0, 3).forEach(p => {
  const varSummary = (p.variants || []).map(v => `${v.unit_size}: ₹${v.price} (MRP: ₹${v.mrp})`).join(' | ');
  console.log(`- [${p.sku}] ${p.name} | Base Pack: ${p.unit_size} | Rate: ₹${p.price} (MRP: ₹${p.mrp})`);
  if (varSummary) {
    console.log(`  Variants (${p.variants.length}): ${varSummary}`);
  }
});

const cats = {};
data.forEach(p => {
  cats[p.category] = (cats[p.category] || 0) + 1;
});
console.log('\n--- Category Breakdown (Top 8) ---');
Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0, 8).forEach(([cat, count]) => {
  console.log(`- ${cat}: ${count} products`);
});
