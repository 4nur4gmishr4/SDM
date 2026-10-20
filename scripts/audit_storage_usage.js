import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdminConfig } from './env_loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { supabaseUrl, supabaseKey } = getSupabaseAdminConfig();
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Auditing 39 storage files against live DB and all code files...');

  const { data: dbBanners } = await supabase.from('banners').select('*');
  const { data: dbCategories } = await supabase.from('categories').select('*');
  const { data: dbSettings } = await supabase.from('app_settings').select('*');
  const { data: dbProds } = await supabase.from('products').select('id, name, image_url').ilike('image_url', '%store-media%');

  console.log(`Live DB rows: ${dbBanners?.length} banners, ${dbCategories?.length} categories, ${dbProds?.length} products linked to store-media.`);

  function scanDir(dir) {
    let results = [];
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) {
        if (!['node_modules', 'dist', '.git'].includes(f.name)) results = results.concat(scanDir(p));
      } else if (f.isFile() && !f.name.endsWith('.log')) {
        results.push(p);
      }
    }
    return results;
  }

  const baseDir = path.resolve(__dirname, '..');
  const codeFiles = scanDir(path.join(baseDir, 'src')).concat([
    path.join(baseDir, 'index.html'),
    path.join(baseDir, 'vite.config.ts')
  ]);

  const codeContents = codeFiles.map(file => ({
    file,
    relPath: path.relative(baseDir, file),
    content: fs.readFileSync(file, 'utf8')
  }));

  async function listRecursive(folder = '') {
    const { data, error } = await supabase.storage.from('store-media').list(folder, { limit: 1000 });
    if (error) return [];
    let files = [];
    for (const item of (data || [])) {
      const fullPath = folder ? folder + '/' + item.name : item.name;
      if (item.id === null || !item.metadata) {
        files = files.concat(await listRecursive(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    return files;
  }

  const all39 = await listRecursive();

  const auditReport = [];

  for (const filePath of all39) {
    const fileName = path.basename(filePath);
    const uses = [];

    // 1. Check DB Banners
    for (const b of (dbBanners || [])) {
      if (b.image_url && b.image_url.includes(fileName)) {
        uses.push(`DB banners (title: "${b.title}", active: ${b.is_active})`);
      }
    }

    // 2. Check DB Categories
    for (const c of (dbCategories || [])) {
      if (c.image_url && (c.image_url.includes(fileName) || c.image_url.includes(filePath))) {
        uses.push(`DB categories (slug: "${c.slug}", name: "${c.name}")`);
      }
    }

    // 3. Check DB Products
    for (const p of (dbProds || [])) {
      if (p.image_url && p.image_url.includes(fileName)) {
        uses.push(`DB products (name: "${p.name}")`);
      }
    }

    // 4. Check DB Settings
    for (const s of (dbSettings || [])) {
      const str = JSON.stringify(s);
      if (str.includes(fileName)) {
        uses.push(`DB app_settings`);
      }
    }

    // 5. Check Code files
    for (const { relPath, content } of codeContents) {
      if (content.includes(fileName) || content.includes(filePath)) {
        uses.push(`Code: ${relPath}`);
      }
    }

    auditReport.push({
      path: filePath,
      inUse: uses.length > 0,
      usedBy: uses
    });
  }

  const active = auditReport.filter(a => a.inUse);
  const unused = auditReport.filter(a => !a.inUse);

  console.log('\n======================================================');
  console.log(`TOTAL FILES: ${auditReport.length}`);
  console.log(`CURRENTLY IN USE: ${active.length}`);
  console.log(`UNUSED (ORPHANED): ${unused.length}`);
  console.log('======================================================');

  console.log('\n--- ACTIVE FILES (IN USE) ---');
  active.forEach(a => {
    console.log(`✔ [${a.path}] -> ${a.usedBy.join(' | ')}`);
  });

  console.log('\n--- UNUSED FILES (SAFE TO DELETE) ---');
  unused.forEach(a => {
    console.log(`✖ [${a.path}]`);
  });
}

run().catch(console.error);
