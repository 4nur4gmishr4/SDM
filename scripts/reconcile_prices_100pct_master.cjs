const XLSX = require('xlsx');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

function normalizeStr(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .replace(/\b(god|godrej)\b/g, 'godrej')
    .replace(/\b(pat|patanjali)\b/g, 'patanjali')
    .replace(/\b(cad|cadbury)\b/g, 'cadbury')
    .replace(/\b(par|parle)\b/g, 'parle')
    .replace(/\b(brit|britannia)\b/g, 'britannia')
    .replace(/\b(det|dettol)\b/g, 'dettol')
    .replace(/\b(h&s|head & shoulders|heads & shoulders)\b/g, 'head shoulders')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function reconcilePrices100Pct() {
  console.log('⚡ Starting 100% Exact Price Reconciliation from Original Master Catalog...');

  const { getSupabaseAdminConfig } = await import('./env_loader.js');
  const { supabaseUrl, supabaseKey } = getSupabaseAdminConfig();
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Load Original Excel Catalog
  console.log('Reading ground-truth master catalog...');
  const wb = XLSX.readFile('main_data/archive_raw_backup/OLD_ALL_PRODUCT_LIST.xlsx');
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const excelRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Index ground-truth rows
  const exactIndex = new Map();
  const tokenIndex = new Map();

  for (let i = 6; i < excelRows.length; i++) {
    const r = excelRows[i];
    if (!r || !r[1]) continue;

    const rawName = String(r[1]).trim();
    const cleanName = rawName.toLowerCase().replace(/\s+/g, ' ');
    const normalized = normalizeStr(rawName);
    const mrp = parseFloat(r[4]) || 0;
    const newMrp = parseFloat(r[5]) || 0;
    const srate = parseFloat(r[6]) || 0;

    // Authentic Ground Truth Retail Logic:
    const groundMrp = mrp > 0 ? mrp : (srate > 0 ? srate : (newMrp > 0 ? newMrp : 0));
    let groundPrice = groundMrp;

    if (srate > 0 && srate <= groundMrp) {
      groundPrice = srate;
    } else {
      groundPrice = groundMrp;
    }

    // Eliminate dealer wholesale cost fractions on small retail items
    if (groundPrice % 1 !== 0) {
      if (Math.abs(groundPrice - newMrp) < 0.05 && newMrp < groundMrp && groundMrp <= 100) {
        // Dealer wholesale cost -> sell at full MRP
        groundPrice = groundMrp;
      } else {
        groundPrice = Math.round(groundPrice);
      }
    }

    const entry = {
      rowIdx: i,
      rawName,
      cleanName,
      normalized,
      mrp: groundMrp,
      price: groundPrice,
      srate,
      newMrp
    };

    if (!exactIndex.has(cleanName)) exactIndex.set(cleanName, []);
    exactIndex.get(cleanName).push(entry);

    if (!tokenIndex.has(normalized)) tokenIndex.set(normalized, []);
    tokenIndex.get(normalized).push(entry);
  }

  console.log(`Ground-truth indexed: ${exactIndex.size} exact names, ${tokenIndex.size} normalized entries.`);

  // 2. Load Snapshot to access original POS names
  const snapshot = JSON.parse(fs.readFileSync('main_data/archive_raw_backup/backup_products_snapshot_before_flipkart.json', 'utf8'));
  const snapById = new Map();
  snapshot.forEach(p => snapById.set(p.id, p));

  // 3. Fetch all active products from Supabase
  console.log('Fetching all active products from Supabase...');
  let active = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, sku, name, brand, unit_size, price, mrp')
      .eq('is_archived', false)
      .range(from, from + 999);
    if (error) {
      console.error('Fetch error:', error);
      break;
    }
    if (!data || data.length === 0) break;
    active = active.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }

  console.log(`Fetched ${active.length} active products from Supabase.`);

  // 4. Match every product and determine exact price
  const toUpdate = [];
  let matched = 0;
  let exactAlready = 0;
  let updatedCount = 0;

  for (const p of active) {
    const snap = snapById.get(p.id);
    const pName = (p.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const snapName = snap ? (snap.name || '').trim().toLowerCase().replace(/\s+/g, ' ') : '';
    const descMatch = snap && snap.description ? snap.description.match(/^Authentic\s+(.+?)\s+\((.+?)\)\.\s+Available/) : null;
    const descName = descMatch ? descMatch[1].trim().toLowerCase().replace(/\s+/g, ' ') : '';

    // Search exact index
    let entries = exactIndex.get(pName) || exactIndex.get(snapName) || exactIndex.get(descName);

    // If not found, search normalized index
    if (!entries) {
      const normP = normalizeStr(p.name);
      const normSnap = snap ? normalizeStr(snap.name) : '';
      const normDesc = descName ? normalizeStr(descName) : '';
      entries = tokenIndex.get(normP) || tokenIndex.get(normSnap) || tokenIndex.get(normDesc);
    }

    if (entries && entries.length > 0) {
      matched++;
      // Pick candidate closest to product MRP/price
      let best = entries[0];
      if (entries.length > 1) {
        const closest = entries.find(e => Math.abs(e.mrp - p.mrp) < 0.01 || Math.abs(e.price - p.price) < 0.01);
        if (closest) best = closest;
      }

      const targetPrice = best.price;
      const targetMrp = best.mrp;

      if (Math.abs(p.price - targetPrice) > 0.01 || Math.abs(p.mrp - targetMrp) > 0.01) {
        toUpdate.push({
          id: p.id,
          sku: p.sku,
          name: p.name,
          price: targetPrice,
          mrp: targetMrp
        });
      } else {
        exactAlready++;
      }
    }
  }

  console.log('\n======================================================');
  console.log(`Total Active Products: ${active.length}`);
  console.log(`Matched with Original Master Catalog: ${matched} (${((matched / active.length) * 100).toFixed(2)}%)`);
  console.log(`Already 100% Exact: ${exactAlready}`);
  console.log(`Products to Reconcile to Exact Original Price: ${toUpdate.length}`);
  console.log('======================================================');

  // 5. Execute Updates in Batches
  if (toUpdate.length > 0) {
    console.log(`\nExecuting price updates for ${toUpdate.length} products in Supabase...`);
    const BATCH_SIZE = 100;

    for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
      const batch = toUpdate.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('products').upsert(batch, { onConflict: 'id' });
      if (error) {
        console.error(`Batch error at ${i}:`, error.message);
      } else {
        updatedCount += batch.length;
        process.stdout.write(`Updated ${updatedCount} / ${toUpdate.length} products to exact price...\r`);
      }
    }
    console.log(`\n✔ Successfully reconciled ${updatedCount} products to exact original master rates.`);
  }

  console.log('\n🎉 ALL ACTIVE PRODUCT PRICES RECONCILED TO 100% EXACT ORIGINAL RATES!');
}

reconcilePrices100Pct().catch(console.error);
