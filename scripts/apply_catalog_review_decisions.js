import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdminConfig } from './env_loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { supabaseUrl, supabaseKey } = getSupabaseAdminConfig();
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDecisions() {
  const jsonArg = process.argv[2];
  let jsonPath = '';

  if (jsonArg) {
    jsonPath = path.resolve(jsonArg);
  } else {
    // Look for latest sdm_catalog_review_*.json in project root or Downloads
    const baseDir = path.resolve(__dirname, '..');
    const files = fs.readdirSync(baseDir).filter(f => f.startsWith('sdm_catalog_review_') && f.endsWith('.json'));
    if (files.length > 0) {
      files.sort().reverse();
      jsonPath = path.join(baseDir, files[0]);
    }
  }

  if (!jsonPath || !fs.existsSync(jsonPath)) {
    console.error('❌ No decisions JSON file found. Please provide path: node apply_catalog_review_decisions.js <path_to_decisions.json>');
    process.exit(1);
  }

  console.log(`Loading review decisions from: ${jsonPath}`);
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const decisions = data.decisions || {};

  const rejectedIds = Object.entries(decisions)
    .filter(([, status]) => status === 'REJECTED')
    .map(([id]) => id);

  const approvedIds = Object.entries(decisions)
    .filter(([, status]) => status === 'APPROVED')
    .map(([id]) => id);

  console.log(`Total decisions found: ${Object.keys(decisions).length}`);
  console.log(`- Approved (Sahi): ${approvedIds.length}`);
  console.log(`- Rejected (Galat - to remove image): ${rejectedIds.length}`);

  if (rejectedIds.length === 0) {
    console.log('No rejected items found in file. Database already in sync!');
    return;
  }

  // Remove wrong image_url from Supabase products by SKU
  console.log(`\nRemoving image_url for ${rejectedIds.length} rejected products in Supabase...`);
  const BATCH_SIZE = 100;
  let updatedCount = 0;

  for (let i = 0; i < rejectedIds.length; i += BATCH_SIZE) {
    const batch = rejectedIds.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('products')
      .update({ image_url: null })
      .in('sku', batch);

    if (error) {
      console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error.message);
    } else {
      updatedCount += batch.length;
      process.stdout.write(`Updated ${updatedCount} / ${rejectedIds.length} products in Supabase...\r`);
    }
  }

  console.log(`\n🎉 Successfully removed wrong images for ${updatedCount} products in live Supabase database!`);
}

applyDecisions().catch(console.error);
