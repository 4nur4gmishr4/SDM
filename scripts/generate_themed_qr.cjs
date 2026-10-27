const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const jsQR = require('jsqr');
const { PNG } = require('pngjs');

const UPI_PAYLOAD = 'upi://pay?pa=ibkPOS.EP116181@icici&pn=M/S.SAI DARSHAN SHOPPING MART&tr=EPYSSQREP116181';
const UPI_ID = 'ibkPOS.EP116181@icici';
const STORE_NAME = 'Sai Darshan Shopping Mart';
const STORE_LEGAL_NAME = 'M/S. SAI DARSHAN SHOPPING MART';
const STORE_SUB = 'Fresh Groceries & Supermarket • Jabalpur';

async function run() {
  console.log('Generating Themed QR for payload:', UPI_PAYLOAD);

  // 1. Generate standalone QR code (high-res PNG)
  const qrPngBuffer = await QRCode.toBuffer(UPI_PAYLOAD, {
    errorCorrectionLevel: 'H',
    type: 'png',
    quality: 1,
    margin: 3,
    color: {
      dark: '#0D652D', // Deep supermarket green for flawless camera scanning
      light: '#FFFFFF'
    },
    width: 800
  });

  // Verify that the generated QR decodes 100% identically
  const png = PNG.sync.read(qrPngBuffer);
  const decoded = jsQR(png.data, png.width, png.height);
  if (!decoded || decoded.data !== UPI_PAYLOAD) {
    console.error('VERIFICATION FAILED! Decoded:', decoded ? decoded.data : 'null');
    process.exit(1);
  }
  console.log('✅ QR Code Verification Passed! Scans identically to physical standee.');

  // Convert QR PNG to base64 for embedding in standalone and composite SVGs
  const qrBase64 = qrPngBuffer.toString('base64');

  // 2. Generate Standalone Themed QR Code (SVG)
  const standaloneSvg = await QRCode.toString(UPI_PAYLOAD, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#1E8E3E', // M3 Primary Green
      light: '#FFFFFF'
    }
  });

  // 3. Generate Complete Digital Standee / Payment Card (SVG)
  // Dimensions: 600 x 920 (modern aspect ratio for mobile modal, store counter standee, or printable flyer)
  const cardSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="600" height="920" viewBox="0 0 600 920" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="300" y1="0" x2="300" y2="920" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0E3D1E" />
      <stop offset="28%" stop-color="#145A2C" />
      <stop offset="100%" stop-color="#092813" />
    </linearGradient>

    <!-- Header Shimmer -->
    <linearGradient id="headerGold" x1="0" y1="0" x2="600" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F9AB00" />
      <stop offset="50%" stop-color="#FDD663" />
      <stop offset="100%" stop-color="#F9AB00" />
    </linearGradient>

    <!-- Glass Overlay -->
    <linearGradient id="glassCard" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1" />
      <stop offset="100%" stop-color="#F9FBF9" stop-opacity="1" />
    </linearGradient>

    <!-- Card Shadow -->
    <filter id="cardShadow" x="-20" y="-10" width="640" height="940" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.35" />
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.2" />
    </filter>

    <!-- Soft QR Plate Shadow -->
    <filter id="qrShadow" x="50" y="240" width="500" height="520" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.12" />
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.08" />
    </filter>

    <clipPath id="qrClip">
      <rect x="100" y="295" width="400" height="400" rx="20" />
    </clipPath>
  </defs>

  <style>
    .font-brand { font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-weight: 800; }
    .font-sub { font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-weight: 500; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-weight: 700; }
  </style>

  <!-- Base Background -->
  <rect width="600" height="920" rx="36" fill="url(#bgGrad)" />

  <!-- Subtle Supermarket Organic Pattern / Rings in Background -->
  <circle cx="530" cy="120" r="180" stroke="#FFFFFF" stroke-opacity="0.04" stroke-width="40" />
  <circle cx="70" cy="800" r="140" stroke="#F9AB00" stroke-opacity="0.04" stroke-width="30" />

  <!-- Top Accent Bar -->
  <rect x="0" y="0" width="600" height="8" rx="4" fill="url(#headerGold)" />

  <!-- Store Header Block -->
  <g transform="translate(0, 48)">
    <!-- Store Badge Icon -->
    <rect x="268" y="0" width="64" height="64" rx="18" fill="#1E8E3E" stroke="#81C995" stroke-width="2" />
    <path d="M288 32 L300 20 L312 32 M300 24 L300 44 M290 44 L310 44" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Brand Name -->
    <text x="300" y="94" text-anchor="middle" fill="#FFFFFF" class="font-brand" font-size="26" letter-spacing="0.5">${STORE_NAME.toUpperCase()}</text>
    
    <!-- Legal Registration -->
    <text x="300" y="118" text-anchor="middle" fill="#81C995" class="font-sub" font-size="13" letter-spacing="1.2">${STORE_LEGAL_NAME}</text>
    
    <!-- Location Pill -->
    <rect x="150" y="132" width="300" height="26" rx="13" fill="#FFFFFF" fill-opacity="0.1" />
    <text x="300" y="149" text-anchor="middle" fill="#CEEAD6" class="font-sub" font-size="11.5">${STORE_SUB}</text>
  </g>

  <!-- Main White Card Container -->
  <rect x="44" y="235" width="512" height="520" rx="28" fill="url(#glassCard)" filter="url(#cardShadow)" />

  <!-- Scan & Pay Banner on Card -->
  <g transform="translate(44, 235)">
    <path d="M 0 28 Q 0 0 28 0 L 484 0 Q 512 0 512 28 L 512 56 L 0 56 Z" fill="#E6F4EA" />
    <text x="256" y="36" text-anchor="middle" fill="#0D652D" class="font-brand" font-size="15" letter-spacing="2">SCAN TO PAY WITH ANY UPI APP</text>
  </g>

  <!-- QR Code Container Inner Border -->
  <rect x="90" y="305" width="420" height="420" rx="24" fill="#FFFFFF" stroke="#E0E6E1" stroke-width="1.5" />

  <!-- The Actual QR Code Image (Embedded High-Res Scannable) -->
  <image x="100" y="315" width="400" height="400" href="data:image/png;base64,${qrBase64}" preserveAspectRatio="xMidYMid meet" />

  <!-- Center Store Branding Badge inside QR (Safe with Level H Error Correction) -->
  <g transform="translate(262, 477)">
    <rect x="-4" y="-4" width="84" height="84" rx="20" fill="#FFFFFF" stroke="#1E8E3E" stroke-width="3" filter="url(#qrShadow)" />
    <rect x="4" y="4" width="68" height="68" rx="14" fill="#1E8E3E" />
    <!-- Stylized Shopping Cart / Mart Icon -->
    <path d="M22 28 H26 L30 46 H50 L54 34 H28" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    <circle cx="34" cy="52" r="3.2" fill="#F9AB00" />
    <circle cx="47" cy="52" r="3.2" fill="#F9AB00" />
  </g>

  <!-- UPI ID Highlight Box -->
  <g transform="translate(0, 774)">
    <rect x="90" y="0" width="420" height="48" rx="24" fill="#FFFFFF" fill-opacity="0.12" stroke="#81C995" stroke-opacity="0.4" stroke-width="1.2" />
    <text x="115" y="30" fill="#A8DAB5" class="font-sub" font-size="13">UPI ID:</text>
    <text x="310" y="30" text-anchor="middle" fill="#FFFFFF" class="font-mono" font-size="15" letter-spacing="0.5">${UPI_ID}</text>
  </g>

  <!-- Payment Apps Logos Strip (Clean SVG Badges) -->
  <g transform="translate(80, 846)">
    <!-- GPay -->
    <g transform="translate(10, 0)">
      <rect width="66" height="30" rx="8" fill="#FFFFFF" fill-opacity="0.12" />
      <text x="33" y="19" text-anchor="middle" fill="#FFFFFF" class="font-brand" font-size="11">G Pay</text>
    </g>

    <!-- PhonePe -->
    <g transform="translate(88, 0)">
      <rect width="78" height="30" rx="8" fill="#FFFFFF" fill-opacity="0.12" />
      <text x="39" y="19" text-anchor="middle" fill="#FFFFFF" class="font-brand" font-size="11">PhonePe</text>
    </g>

    <!-- Paytm -->
    <g transform="translate(178, 0)">
      <rect width="68" height="30" rx="8" fill="#FFFFFF" fill-opacity="0.12" />
      <text x="34" y="19" text-anchor="middle" fill="#FFFFFF" class="font-brand" font-size="11">Paytm</text>
    </g>

    <!-- BHIM -->
    <g transform="translate(258, 0)">
      <rect width="62" height="30" rx="8" fill="#FFFFFF" fill-opacity="0.12" />
      <text x="31" y="19" text-anchor="middle" fill="#FFFFFF" class="font-brand" font-size="11">BHIM</text>
    </g>

    <!-- CRED -->
    <g transform="translate(332, 0)">
      <rect width="68" height="30" rx="8" fill="#FFFFFF" fill-opacity="0.12" />
      <text x="34" y="19" text-anchor="middle" fill="#FFFFFF" class="font-brand" font-size="11">CRED</text>
    </g>
  </g>

  <!-- Bottom Direct Bank Settlement Note -->
  <text x="300" y="898" text-anchor="middle" fill="#81C995" class="font-sub" font-size="11.5" letter-spacing="0.4">
    Zero Convenience Fee • Direct Bank Settlement • Instant Confirmation
  </text>
</svg>`;

  // 4. Save to public directory
  const publicDir = path.resolve(__dirname, '../public');
  fs.writeFileSync(path.join(publicDir, 'sai-darshan-upi-qr-card.svg'), cardSvg, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sai-darshan-upi-qr.png'), qrPngBuffer);
  fs.writeFileSync(path.join(publicDir, 'sai-darshan-upi-qr-raw.svg'), standaloneSvg, 'utf8');

  // 5. Save copy to artifacts directory for immediate user access
  const artifactDir = 'C:/Users/anura/.gemini/antigravity-ide/brain/eb2c5727-27aa-4e53-a37a-801d21caa441';
  fs.writeFileSync(path.join(artifactDir, 'sai-darshan-upi-qr-card.svg'), cardSvg, 'utf8');
  fs.writeFileSync(path.join(artifactDir, 'sai-darshan-upi-qr.png'), qrPngBuffer);

  console.log('Saved files:');
  console.log('1.', path.join(publicDir, 'sai-darshan-upi-qr-card.svg'));
  console.log('2.', path.join(publicDir, 'sai-darshan-upi-qr.png'));
  console.log('3.', path.join(publicDir, 'sai-darshan-upi-qr-raw.svg'));
  console.log('4.', path.join(artifactDir, 'sai-darshan-upi-qr-card.svg'));
  console.log('5.', path.join(artifactDir, 'sai-darshan-upi-qr.png'));
}

run().catch(err => {
  console.error('Error generating QR:', err);
  process.exit(1);
});
