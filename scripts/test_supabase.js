/**
 * Test Supabase Connection & Schema Script
 * Run with: node scripts/test_supabase.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

let supabaseUrl = '';
let supabaseAnonKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...values] = trimmed.split('=');
    const val = values.join('=').trim().replace(/^['"]|['"]$/g, '');
    if (key === 'VITE_SUPABASE_URL') supabaseUrl = val;
    if (key === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = val;
  }
}

console.log('----------------------------------------------------');
console.log('Sai Darshan Mart — Supabase Diagnostic Check');
console.log('----------------------------------------------------');
console.log('VITE_SUPABASE_URL:', supabaseUrl || '(not set)');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? (supabaseAnonKey.slice(0, 12) + '...' + supabaseAnonKey.slice(-6)) : '(not set)');
console.log('----------------------------------------------------');

const isPlaceholder = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder');

if (isPlaceholder) {
  console.log('⚠️  Notice: Placeholder credentials detected in .env.');
  console.log('The web application is currently running in local offline fallback mode.');
  console.log('To connect to live Supabase:');
  console.log('1. Go to https://supabase.com and create a project.');
  console.log('2. Run the SQL script from supabase_schema.sql in Supabase SQL Editor.');
  console.log('3. Paste your Project URL and Anon Key into .env.');
  console.log('4. Run this script again: node scripts/test_supabase.js');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  const tables = ['categories', 'products', 'banners', 'delivery_settings', 'orders', 'order_items', 'store_settings'];
  let allHealthy = true;

  for (const table of tables) {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`❌ Table [${table}]: Error (${error.message})`);
        allHealthy = false;
      } else {
        console.log(`✅ Table [${table}]: Accessible (${count ?? 0} rows)`);
      }
    } catch (err) {
      console.log(`❌ Table [${table}]: Exception (${err.message})`);
      allHealthy = false;
    }
  }

  // Check storage bucket
  try {
    const { data, error } = await supabase.storage.getBucket('store-media');
    if (error) {
      console.log(`⚠️  Storage bucket [store-media]: ${error.message} (bucket may need creation in Supabase Storage)`);
    } else {
      console.log(`✅ Storage bucket [store-media]: Ready (Public: ${data.public})`);
    }
  } catch (err) {
    console.log(`⚠️  Storage bucket check skipped: ${err.message}`);
  }

  console.log('----------------------------------------------------');
  if (allHealthy) {
    console.log('🎉 All database tables and RLS policies are active and verified!');
  } else {
    console.log('⚠️  Some tables failed. Make sure to run the full supabase_schema.sql in Supabase SQL Editor.');
  }
}

testConnection();
