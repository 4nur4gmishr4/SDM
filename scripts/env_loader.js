import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads variables from the local .env file if they are not already set in process.env
 */
export function loadEnv() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.VITE_SUPABASE_URL) {
    return;
  }
  try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const rawLine of content.split('\n')) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (match) {
          const key = match[1];
          let val = (match[2] || '').trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not load local .env file:', err.message);
  }
}

/**
 * Retrieves Supabase URL and Service Role Key safely from environment.
 * Ensures no hardcoded credentials remain in repository source files.
 */
export function getSupabaseAdminConfig() {
  loadEnv();

  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://otyojqnnwbrteknyqcpi.supabase.co';

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseKey) {
    console.error('\n❌ CRITICAL CONFIGURATION ERROR:');
    console.error('SUPABASE_SERVICE_ROLE_KEY is missing from environment variables or .env file.');
    console.error('Please configure SUPABASE_SERVICE_ROLE_KEY in your local .env or GitHub Action secret.\n');
    process.exit(1);
  }

  return { supabaseUrl, supabaseKey };
}
