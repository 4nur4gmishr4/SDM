import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdminConfig } from './env_loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { supabaseUrl, supabaseKey } = getSupabaseAdminConfig();
const supabase = createClient(supabaseUrl, supabaseKey);

async function listRecursive(folder = '') {
  const { data, error } = await supabase.storage.from('store-media').list(folder, { limit: 1000 });
  if (error) {
    console.error('List error:', folder, error);
    return [];
  }
  let files = [];
  for (const item of (data || [])) {
    const fullPath = folder ? folder + '/' + item.name : item.name;
    if (item.id === null || !item.metadata) {
      files = files.concat(await listRecursive(fullPath));
    } else {
      const { data: pub } = supabase.storage.from('store-media').getPublicUrl(fullPath);
      files.push({
        path: fullPath,
        name: item.name,
        folder: folder || 'root',
        size: item.metadata?.size || 0,
        mimetype: item.metadata?.mimetype || 'image/jpeg',
        url: pub.publicUrl
      });
    }
  }
  return files;
}

async function run() {
  console.log('Auditing storage files against database & codebase...');

  const { data: dbBanners } = await supabase.from('banners').select('*');
  const { data: dbCategories } = await supabase.from('categories').select('*');
  const { data: dbSettings } = await supabase.from('app_settings').select('*');
  const { data: dbProds } = await supabase.from('products').select('id, name, image_url').ilike('image_url', '%store-media%');

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
    relPath: path.relative(baseDir, file),
    content: fs.readFileSync(file, 'utf8')
  }));

  const rawFiles = await listRecursive();

  const files = rawFiles.map(f => {
    const fileName = path.basename(f.path);
    const uses = [];

    for (const b of (dbBanners || [])) {
      if (b.image_url && b.image_url.includes(fileName)) {
        uses.push(`DB Banners: ${b.title}`);
      }
    }
    for (const c of (dbCategories || [])) {
      if (c.image_url && (c.image_url.includes(fileName) || c.image_url.includes(f.path))) {
        uses.push(`DB Category: ${c.name}`);
      }
    }
    for (const p of (dbProds || [])) {
      if (p.image_url && p.image_url.includes(fileName)) {
        uses.push(`DB Product: ${p.name}`);
      }
    }
    for (const s of (dbSettings || [])) {
      if (JSON.stringify(s).includes(fileName)) {
        uses.push('DB Settings');
      }
    }
    for (const { relPath, content } of codeContents) {
      if (content.includes(fileName) || content.includes(f.path)) {
        uses.push(relPath);
      }
    }

    return {
      ...f,
      inUse: uses.length > 0,
      usedBy: uses
    };
  });

  const inUseCount = files.filter(f => f.inUse).length;
  const unusedCount = files.filter(f => !f.inUse).length;

  console.log(`Audited: ${files.length} total, ${inUseCount} IN USE, ${unusedCount} UNUSED`);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Supabase Storage Inspector — Sai Darshan Mart</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0d100d;
      --surface: #161b15;
      --surface-elevated: #20271f;
      --surface-hover: #2a3328;
      --border: rgba(255, 255, 255, 0.08);
      --border-active: #10b981;
      --text: #f3f4f1;
      --text-muted: #9ca3af;
      --primary: #10b981;
      --primary-hover: #059669;
      --primary-glow: rgba(16, 185, 129, 0.25);
      --danger: #ef4444;
      --danger-bg: rgba(239, 68, 68, 0.15);
      --amber: #f59e0b;
      --amber-bg: rgba(245, 158, 11, 0.15);
      --radius: 14px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding-bottom: 120px;
      line-height: 1.5;
    }

    /* Header */
    .header {
      background: linear-gradient(180deg, rgba(22, 27, 21, 0.98) 0%, rgba(13, 16, 13, 0.9) 100%);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 50;
      padding: 1.25rem 2rem;
    }
    .header-inner {
      max-width: 1440px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .brand-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #10b981, #047857);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.25rem;
      box-shadow: 0 4px 14px var(--primary-glow);
    }
    .brand-text h1 {
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .brand-text p {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    /* Stats Pill Banner */
    .stats-banner {
      max-width: 1440px;
      margin: 1.25rem auto 0;
      padding: 0 2rem;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .stat-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.2rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 700;
      border: 1px solid transparent;
    }
    .stat-badge.in-use {
      background: rgba(16, 185, 129, 0.12);
      color: #34d399;
      border-color: rgba(16, 185, 129, 0.3);
    }
    .stat-badge.unused {
      background: rgba(239, 68, 68, 0.12);
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.3);
    }

    /* Controls */
    .controls-row {
      max-width: 1440px;
      margin: 1.25rem auto 0.75rem;
      padding: 0 2rem;
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      justify-content: space-between;
    }
    .filter-tabs {
      display: flex;
      gap: 0.4rem;
      background: var(--surface);
      padding: 0.35rem;
      border-radius: 12px;
      border: 1px solid var(--border);
      flex-wrap: wrap;
    }
    .filter-tab {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.45rem 0.85rem;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    .filter-tab:hover {
      color: var(--text);
    }
    .filter-tab.active {
      background: var(--surface-elevated);
      color: var(--primary);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .filter-tab.tab-unused.active {
      color: #f87171;
    }

    .search-box {
      position: relative;
      min-width: 280px;
    }
    .search-box input {
      width: 100%;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 0.55rem 1rem 0.55rem 2.2rem;
      color: var(--text);
      font-family: inherit;
      font-size: 0.85rem;
      outline: none;
      transition: border 0.2s;
    }
    .search-box input:focus {
      border-color: var(--primary);
    }
    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 0.85rem;
      pointer-events: none;
    }

    .selection-controls {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex-wrap: wrap;
    }
    .btn-action-unused {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.3));
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      font-family: inherit;
      font-weight: 700;
      font-size: 0.82rem;
      padding: 0.5rem 0.95rem;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-action-unused:hover {
      background: rgba(239, 68, 68, 0.35);
      transform: scale(1.02);
    }
    .btn-secondary {
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      font-family: inherit;
      font-weight: 600;
      font-size: 0.82rem;
      padding: 0.5rem 0.9rem;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-secondary:hover {
      background: var(--surface-hover);
      border-color: rgba(255,255,255,0.2);
    }

    /* Grid */
    .container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 2rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
      gap: 1.25rem;
      margin-top: 1rem;
    }

    /* Card */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
      user-select: none;
    }
    .card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 28px rgba(0,0,0,0.45);
      border-color: rgba(255,255,255,0.2);
    }
    .card.selected {
      border-color: var(--danger);
      background: #251414;
      box-shadow: 0 8px 24px var(--danger-bg);
    }

    .card-top {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
    }
    .checkbox-wrap {
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      padding: 6px 10px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      border: 1px solid rgba(255,255,255,0.18);
    }
    .checkbox-wrap input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--danger);
    }
    .checkbox-label {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .card.selected .checkbox-label {
      color: #fca5a5;
    }

    .badge-wrap {
      display: flex;
      gap: 0.4rem;
    }
    .status-pill {
      font-size: 0.68rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 4px 8px;
      border-radius: 6px;
      backdrop-filter: blur(8px);
    }
    .status-pill.in-use {
      background: rgba(16, 185, 129, 0.85);
      color: #042f20;
    }
    .status-pill.unused {
      background: rgba(239, 68, 68, 0.85);
      color: white;
    }

    /* Media Viewport */
    .card-media {
      width: 100%;
      height: 200px;
      background: #080907;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
    }
    .card-media img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 10px;
      transition: transform 0.3s;
    }
    .card:hover .card-media img {
      transform: scale(1.05);
    }
    .card-media video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .doc-icon {
      font-size: 3rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }

    /* Content */
    .card-body {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 0.4rem;
    }
    .card-path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      font-weight: 600;
      word-break: break-all;
      color: var(--text);
    }
    .usage-note {
      font-size: 0.72rem;
      padding: 4px 8px;
      border-radius: 6px;
      margin-top: 0.2rem;
      line-height: 1.4;
    }
    .usage-note.in-use {
      background: rgba(16, 185, 129, 0.1);
      color: #6ee7b7;
      border-left: 2px solid var(--primary);
    }
    .usage-note.unused {
      background: rgba(239, 68, 68, 0.1);
      color: #fca5a5;
      border-left: 2px solid var(--danger);
    }

    .card-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 0.6rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border);
    }
    .card-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.6rem;
    }
    .action-btn {
      flex: 1;
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 0.4rem 0.6rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      text-align: center;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .action-btn:hover {
      background: var(--surface-hover);
      color: var(--text);
    }

    /* Floating Bar */
    .floating-bar {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(22, 27, 21, 0.95);
      backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 100px;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75);
      z-index: 100;
      max-width: 90vw;
    }
    .selection-info {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.88rem;
      font-weight: 700;
      white-space: nowrap;
    }
    .count-pill {
      background: var(--danger);
      color: white;
      padding: 0.2rem 0.65rem;
      border-radius: 100px;
      font-size: 0.8rem;
    }
    .btn-copy {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      border: none;
      padding: 0.6rem 1.25rem;
      border-radius: 100px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
      transition: all 0.2s;
      font-family: inherit;
      white-space: nowrap;
    }
    .btn-copy:hover {
      transform: scale(1.03);
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
    }
    .btn-copy:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    .btn-copy-script {
      background: var(--surface-elevated);
      color: var(--text);
      border: 1px solid var(--border);
      padding: 0.6rem 1rem;
      border-radius: 100px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .btn-copy-script:hover {
      background: var(--surface-hover);
      border-color: rgba(255,255,255,0.25);
    }

    /* Toast */
    .toast {
      position: fixed;
      top: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(-100px);
      background: #10b981;
      color: #052e16;
      font-weight: 700;
      padding: 0.75rem 1.5rem;
      border-radius: 100px;
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
      z-index: 200;
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }
    .toast.show {
      transform: translateX(-50%) translateY(0);
    }

    @media (max-width: 768px) {
      .header-inner { flex-direction: column; align-items: flex-start; }
      .controls-row { flex-direction: column; align-items: stretch; }
      .search-box { width: 100%; min-width: 0; }
      .floating-bar { flex-direction: column; border-radius: 20px; width: 92vw; padding: 1rem; }
    }
  </style>
</head>
<body>

  <!-- Toast Notification -->
  <div id="toast" class="toast">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
    <span id="toastMsg">Copied to clipboard!</span>
  </div>

  <!-- Header -->
  <header class="header">
    <div class="header-inner">
      <div class="brand">
        <div class="brand-icon">SDM</div>
        <div class="brand-text">
          <h1>Supabase Storage Inspector (store-media)</h1>
          <p>Live Audit: ${inUseCount} files active in production &bull; ${unusedCount} orphaned / safe to delete</p>
        </div>
      </div>
      <div class="selection-controls">
        <button class="btn-action-unused" onclick="selectUnusedOnly()">Select All Unused (${unusedCount} files)</button>
        <button class="btn-secondary" onclick="selectAll()">Select All (${files.length})</button>
        <button class="btn-secondary" onclick="deselectAll()">Clear Selection</button>
      </div>
    </div>
  </header>

  <!-- Status Banner -->
  <div class="stats-banner">
    <div class="stat-badge in-use">
      <span>✔</span>
      <span>${inUseCount} Active / In Use (Do Not Delete)</span>
    </div>
    <div class="stat-badge unused">
      <span>✖</span>
      <span>${unusedCount} Unused / Orphaned (Safe to Delete)</span>
    </div>
  </div>

  <!-- Filters & Search -->
  <div class="controls-row">
    <div class="filter-tabs">
      <button class="filter-tab active" onclick="setFilter('all', this)">All (${files.length})</button>
      <button class="filter-tab tab-unused" onclick="setFilter('unused', this)">Unused Only (${unusedCount})</button>
      <button class="filter-tab" onclick="setFilter('inuse', this)">In Use (${inUseCount})</button>
      <button class="filter-tab" onclick="setFilter('banners', this)">Banners (${files.filter(f => f.folder === 'banners').length})</button>
      <button class="filter-tab" onclick="setFilter('categories', this)">Categories (${files.filter(f => f.folder === 'categories').length})</button>
      <button class="filter-tab" onclick="setFilter('store', this)">Store Photos (${files.filter(f => f.folder === 'store').length})</button>
      <button class="filter-tab" onclick="setFilter('icons', this)">Icons (${files.filter(f => f.folder === 'icons').length})</button>
    </div>

    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input type="text" id="search" placeholder="Search filename, folder, or usage..." oninput="render()">
    </div>
  </div>

  <!-- Cards Grid -->
  <main class="container">
    <div id="grid" class="grid"></div>
  </main>

  <!-- Sticky Removal Bar -->
  <div class="floating-bar">
    <div class="selection-info">
      <span id="countPill" class="count-pill">0</span>
      <span>selected to remove (<span id="sizeInfo">0 KB</span>)</span>
    </div>
    <button id="btnCopy" class="btn-copy" disabled onclick="copySelectedList()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      Copy Selected Paths
    </button>
    <button id="btnCopyScript" class="btn-copy-script" onclick="copyDeleteCode()">
      Copy as JS / Script
    </button>
  </div>

  <script>
    const FILES = ${JSON.stringify(files, null, 2)};
    const selectedPaths = new Set();
    let currentFilter = 'all';

    function setFilter(filterType, el) {
      currentFilter = filterType;
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      render();
    }

    function toggleSelect(path, e) {
      if (e) e.stopPropagation();
      if (selectedPaths.has(path)) {
        selectedPaths.delete(path);
      } else {
        selectedPaths.add(path);
      }
      updateUI();
    }

    function selectUnusedOnly() {
      selectedPaths.clear();
      FILES.filter(f => !f.inUse).forEach(f => selectedPaths.add(f.path));
      updateUI();
      showToast('Selected all ' + selectedPaths.size + ' unused files!');
    }

    function selectAll() {
      getFilteredFiles().forEach(f => selectedPaths.add(f.path));
      updateUI();
    }

    function deselectAll() {
      selectedPaths.clear();
      updateUI();
    }

    function getFilteredFiles() {
      const q = (document.getElementById('search')?.value || '').toLowerCase().trim();
      return FILES.filter(f => {
        let matchesFilter = true;
        if (currentFilter === 'unused') matchesFilter = !f.inUse;
        else if (currentFilter === 'inuse') matchesFilter = f.inUse;
        else if (currentFilter !== 'all') matchesFilter = f.folder === currentFilter;

        const matchesSearch = !q || 
          f.path.toLowerCase().includes(q) || 
          f.name.toLowerCase().includes(q) ||
          (f.usedBy && f.usedBy.join(' ').toLowerCase().includes(q));

        return matchesFilter && matchesSearch;
      });
    }

    function formatBytes(bytes) {
      if (!bytes || bytes === 0) return '0 KB';
      const k = 1024;
      if (bytes < k * k) return (bytes / k).toFixed(1) + ' KB';
      return (bytes / (k * k)).toFixed(2) + ' MB';
    }

    function showToast(text) {
      const t = document.getElementById('toast');
      document.getElementById('toastMsg').innerText = text;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2600);
    }

    function copySelectedList() {
      const list = Array.from(selectedPaths);
      if (list.length === 0) return;
      const text = list.join('\\n');
      navigator.clipboard.writeText(text).then(() => {
        showToast('Copied ' + list.length + ' file paths to clipboard!');
      });
    }

    function copyDeleteCode() {
      const list = Array.from(selectedPaths);
      if (list.length === 0) {
        showToast('Please select at least one file first!');
        return;
      }
      const code = \`// Supabase Storage Deletion Script for \${list.length} selected files
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const filesToRemove = \${JSON.stringify(list, null, 2)};

async function removeFiles() {
  console.log('Deleting \${list.length} files from Supabase storage...');
  const { data, error } = await supabase.storage
    .from('store-media')
    .remove(filesToRemove);

  if (error) {
    console.error('Delete error:', error);
  } else {
    console.log('Successfully deleted:', data);
  }
}
removeFiles();\`;

      navigator.clipboard.writeText(code).then(() => {
        showToast('Copied deletion script to clipboard!');
      });
    }

    function updateUI() {
      document.querySelectorAll('.card').forEach(card => {
        const p = card.dataset.path;
        const isSel = selectedPaths.has(p);
        card.classList.toggle('selected', isSel);
        const cb = card.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = isSel;
      });

      const count = selectedPaths.size;
      document.getElementById('countPill').innerText = count;
      const btn = document.getElementById('btnCopy');
      btn.disabled = count === 0;

      let totalBytes = 0;
      FILES.forEach(f => {
        if (selectedPaths.has(f.path)) totalBytes += f.size;
      });
      document.getElementById('sizeInfo').innerText = formatBytes(totalBytes);
    }

    function render() {
      const grid = document.getElementById('grid');
      const filtered = getFilteredFiles();

      if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-muted);">No files match your search filter.</div>';
        return;
      }

      grid.innerHTML = filtered.map(f => {
        const isSel = selectedPaths.has(f.path);
        const isVideo = f.mimetype.startsWith('video');
        const isJson = f.name.endsWith('.json');

        let mediaEl = '';
        if (isVideo) {
          mediaEl = \`<video src="\${f.url}" preload="metadata" controls></video>\`;
        } else if (isJson) {
          mediaEl = \`<div class="doc-icon">{ }</div>\`;
        } else {
          mediaEl = \`<img src="\${f.url}" alt="\${f.name}" loading="lazy" />\`;
        }

        const usageNote = f.inUse
          ? \`<div class="usage-note in-use">✔ Active in: \${f.usedBy.slice(0, 2).join(', ')}</div>\`
          : \`<div class="usage-note unused">✖ Not used in DB or code (Safe to remove)</div>\`;

        return \`
          <div class="card \${isSel ? 'selected' : ''}" data-path="\${f.path}" onclick="toggleSelect('\${f.path}')">
            <div class="card-top">
              <label class="checkbox-wrap" onclick="event.stopPropagation()">
                <input type="checkbox" \${isSel ? 'checked' : ''} onchange="toggleSelect('\${f.path}', event)">
                <span class="checkbox-label">\${isSel ? 'MARKED' : 'SELECT'}</span>
              </label>
              <div class="badge-wrap">
                <span class="status-pill \${f.inUse ? 'in-use' : 'unused'}">\${f.inUse ? 'IN USE' : 'UNUSED'}</span>
              </div>
            </div>

            <div class="card-media">
              \${mediaEl}
            </div>

            <div class="card-body">
              <div class="card-path" title="\${f.path}">\${f.path}</div>
              \${usageNote}
              <div class="card-meta">
                <span>\${formatBytes(f.size)}</span>
                <span>\${f.folder}</span>
              </div>
              <div class="card-actions" onclick="event.stopPropagation()">
                <button class="action-btn" onclick="navigator.clipboard.writeText('\${f.path}'); showToast('Copied path!');">Copy Path</button>
                <a class="action-btn" href="\${f.url}" target="_blank" rel="noreferrer">Open</a>
              </div>
            </div>
          </div>
        \`;
      }).join('');

      updateUI();
    }

    render();
  </script>
</body>
</html>`;

  const targetPath = path.resolve(__dirname, '../storage_inspector.html');
  fs.writeFileSync(targetPath, html, 'utf8');
  console.log(`✅ storage_inspector.html successfully updated at: ${targetPath}`);
}

run().catch(console.error);
