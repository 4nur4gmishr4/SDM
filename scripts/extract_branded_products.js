/**
 * Precision Brand Extractor for Sai Darshan Mart
 * Identifies genuine branded products from ALL PRODUCT LIST.xlsx
 * by prioritizing product titles (where actual brands like Maggi, Amul, Cadbury,
 * Britannia, Colgate, Surf Excel reside) rather than distributor/agency codes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSXModule from 'xlsx';

const XLSX = XLSXModule.default || XLSXModule;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Well-known FMCG brands in Indian supermarkets
const BRAND_RULES = [
  // Snacks, Biscuits & Confectionery
  { brand: 'Britannia', keywords: ['BRITANNIA', 'GOOD DAY', '50-50', '50 50', 'BOURBON', 'NUTRICHOICE', 'PURE MAGIC', 'JIM JAM', 'LITTLE HEARTS', 'MARIE GOLD', 'TREAT '], category: 'Snacks & Munchies' },
  { brand: 'Parle', keywords: ['PARLE', 'PARLE-G', 'PARLE G', 'MONACO', 'KRACKJACK', 'HIDE & SEEK', 'HIDE AND SEEK', '20-20', 'MILANO', 'FESTO', 'KISMI', 'POPPINS', 'MANGO BITE', 'MELODY '], category: 'Snacks & Munchies' },
  { brand: 'Nestle (Maggi / KitKat)', keywords: ['MAGGI', 'KITKAT', 'KIT KAT', 'NESTLE', 'MILKYBAR', 'BAR ONE', 'POLO ', 'EVERYDAY ', 'CERELAC', 'LACTOGEN', 'NAN PRO', 'NESCAFE', 'MILO '], category: 'Snacks & Munchies' },
  { brand: 'Cadbury (Mondelez)', keywords: ['CADBURY', 'DAIRY MILK', '5 STAR', 'FIVE STAR', 'PERK ', 'GEMS ', 'BOURN VITA', 'BOURNVITA', 'CELEBRATIONS', 'FUSE ', 'NUTTIES', 'CHOCLAIR', 'OREO', 'TANG '], category: 'Snacks & Munchies' },
  { brand: 'Haldiram\'s', keywords: ['HALDIRAM', 'HALDIRAMS'], category: 'Snacks & Munchies' },
  { brand: 'Bikaji', keywords: ['BIKAJI'], category: 'Snacks & Munchies' },
  { brand: 'Balaji', keywords: ['BALAJI '], category: 'Snacks & Munchies' },
  { brand: 'Bikano', keywords: ['BIKANO'], category: 'Snacks & Munchies' },
  { brand: 'Sunfeast (ITC)', keywords: ['SUNFEAST', 'DARK FANTASY', 'MOM MAGIC', 'BOUNCE ', 'FARMLITE', 'YIPPEE', 'YIPPE'], category: 'Snacks & Munchies' },
  { brand: 'Bingo (ITC)', keywords: ['BINGO', 'TEDHE MEDHE', 'MAD ANGLES'], category: 'Snacks & Munchies' },
  { brand: 'Lay\'s (PepsiCo)', keywords: ['LAYS', 'LAY S', 'LAY\'S'], category: 'Snacks & Munchies' },
  { brand: 'Kurkure (PepsiCo)', keywords: ['KURKURE'], category: 'Snacks & Munchies' },
  { brand: 'Doritos', keywords: ['DORITOS', 'CHEETOS'], category: 'Snacks & Munchies' },
  { brand: 'Unibic', keywords: ['UNIBIC'], category: 'Snacks & Munchies' },
  { brand: 'Bisk Farm', keywords: ['BISK FARM'], category: 'Snacks & Munchies' },
  { brand: 'Crax', keywords: ['CRAX '], category: 'Snacks & Munchies' },
  { brand: 'Chupa Chups / Mentos', keywords: ['CHUPA CHUP', 'MENTOS', 'ALPENLIEBE', 'CENTER FRESH', 'CENTER FRUIT', 'HAPPIEDENT', 'HAPPYDENT'], category: 'Snacks & Munchies' },
  { brand: 'Kinder Joy / Ferrero', keywords: ['KINDER JOY', 'FERRERO', 'NUTELLA'], category: 'Snacks & Munchies' },

  // Dairy & Bakery
  { brand: 'Amul', keywords: ['AMUL'], category: 'Dairy & Bakery' },
  { brand: 'Mother Dairy', keywords: ['MOTHER DAIRY'], category: 'Dairy & Bakery' },
  { brand: 'Gowardhan', keywords: ['GOWARDHAN', 'GO CHEESE'], category: 'Dairy & Bakery' },

  // Staples & Cooking Essentials
  { brand: 'Aashirvaad (ITC)', keywords: ['AASHIRVAAD', 'ASHIRWAD', 'ASHIRVAAD', 'AASHIRWAD'], category: 'Atta, Rice & Dals' },
  { brand: 'Fortune (Adani Wilmar)', keywords: ['FORTUNE '], category: 'Oils & Masalas' },
  { brand: 'Saffola (Marico)', keywords: ['SAFFOLA'], category: 'Oils & Masalas' },
  { brand: 'Dhara', keywords: ['DHARA '], category: 'Oils & Masalas' },
  { brand: 'Gemini', keywords: ['GEMINI OIL', 'GEMINI '], category: 'Oils & Masalas' },
  { brand: 'Tata Sampann / Tata Salt', keywords: ['TATA SALT', 'TATA SAMPANN', 'SAMPANN '], category: 'Atta, Rice & Dals' },
  { brand: 'Daawat', keywords: ['DAAWAT', 'DEVAYA'], category: 'Atta, Rice & Dals' },
  { brand: 'India Gate', keywords: ['INDIA GATE'], category: 'Atta, Rice & Dals' },
  { brand: 'Kohinoor', keywords: ['KOHINOOR'], category: 'Atta, Rice & Dals' },
  { brand: 'Pillsbury', keywords: ['PILLSBURY'], category: 'Atta, Rice & Dals' },

  // Spices & Condiments
  { brand: 'Everest', keywords: ['EVEREST '], category: 'Oils & Masalas' },
  { brand: 'MDH', keywords: ['MDH '], category: 'Oils & Masalas' },
  { brand: 'Catch', keywords: ['CATCH '], category: 'Oils & Masalas' },
  { brand: 'Badshah', keywords: ['BADSHAH'], category: 'Oils & Masalas' },
  { brand: 'Goldiee', keywords: ['GOLDIEE'], category: 'Oils & Masalas' },
  { brand: 'Pushp', keywords: ['PUSHP '], category: 'Oils & Masalas' },
  { brand: 'Kissan (HUL)', keywords: ['KISSAN'], category: 'Oils & Masalas' },
  { brand: 'Heinz', keywords: ['HEINZ'], category: 'Oils & Masalas' },
  { brand: 'Veeba', keywords: ['VEEBA'], category: 'Oils & Masalas' },
  { brand: 'FunFoods / Dr. Oetker', keywords: ['FUN FOODS', 'FUNFOODS', 'DR OETKER', 'DR. OETKER'], category: 'Oils & Masalas' },
  { brand: 'Ching\'s Secret', keywords: ['CHINGS', 'CHING\'S', 'SCHEZWAN CHUTNEY', 'HAKKA NOODLES'], category: 'Snacks & Munchies' },
  { brand: 'Smith & Jones', keywords: ['SMITH & JONES', 'SMITH AND JONES'], category: 'Oils & Masalas' },

  // Breakfast Cereals
  { brand: 'Kellogg\'s', keywords: ['KELLOGG', 'KELLOGGS', 'CORN FLAKES', 'CHOCOS', 'MUESLI'], category: 'Snacks & Munchies' },
  { brand: 'Quaker', keywords: ['QUAKER'], category: 'Snacks & Munchies' },

  // Beverages & Drinks
  { brand: 'Tata Tea', keywords: ['TATA TEA', 'TATA GOLD', 'TATA AGNI', 'TATA PREMIUM', 'TETLEY'], category: 'Beverages & Drinks' },
  { brand: 'Brooke Bond (Red Label / Taj Mahal)', keywords: ['RED LABEL', 'BROOKE BOND', 'TAAZA', 'TAJ MAHAL'], category: 'Beverages & Drinks' },
  { brand: 'Wagh Bakri', keywords: ['WAGH BAKRI', 'WAGHBAKRI'], category: 'Beverages & Drinks' },
  { brand: 'Lipton', keywords: ['LIPTON '], category: 'Beverages & Drinks' },
  { brand: 'Bru', keywords: ['BRU COFFEE', 'BRU '], category: 'Beverages & Drinks' },
  { brand: 'Horlicks', keywords: ['HORLICKS'], category: 'Beverages & Drinks' },
  { brand: 'Boost', keywords: ['BOOST '], category: 'Beverages & Drinks' },
  { brand: 'Complan', keywords: ['COMPLAN'], category: 'Beverages & Drinks' },
  { brand: 'Pediasure', keywords: ['PEDIASURE'], category: 'Beverages & Drinks' },
  { brand: 'Coca-Cola (Coke / Sprite / Thums Up / Maaza)', keywords: ['COCA COLA', 'COCA-COLA', 'COKE ', 'THUMS UP', 'SPRITE', 'FANTA', 'LIMCA', 'MAAZA', 'KINLEY '], category: 'Beverages & Drinks' },
  { brand: 'PepsiCo (Pepsi / Mirinda / 7Up / Mountain Dew)', keywords: ['PEPSI ', 'MOUNTAIN DEW', '7UP', '7 UP', 'MIRINDA', 'STING ', 'AQUAFINA', 'SLICE '], category: 'Beverages & Drinks' },
  { brand: 'Frooti / Appy', keywords: ['FROOTI', 'APPY FIZZ', 'APPIE FIZZ'], category: 'Beverages & Drinks' },
  { brand: 'Paper Boat', keywords: ['PAPER BOAT', 'PAPERBOAT'], category: 'Beverages & Drinks' },
  { brand: 'Real / Dabur Juices', keywords: ['REAL JUICE', 'REAL '], category: 'Beverages & Drinks' },
  { brand: 'Rooh Afza (Hamdard)', keywords: ['ROOH AFZA', 'ROOHAFZA'], category: 'Beverages & Drinks' },
  { brand: 'Red Bull', keywords: ['RED BULL', 'REDBULL'], category: 'Beverages & Drinks' },
  { brand: 'Monster Energy', keywords: ['MONSTER ENERGY'], category: 'Beverages & Drinks' },
  { brand: 'Bisleri', keywords: ['BISLERI'], category: 'Beverages & Drinks' },

  // Household & Cleaning
  { brand: 'Surf Excel', keywords: ['SURF EXCEL', 'SURF '], category: 'Household & Cleaning' },
  { brand: 'Ariel', keywords: ['ARIEL '], category: 'Household & Cleaning' },
  { brand: 'Tide', keywords: ['TIDE '], category: 'Household & Cleaning' },
  { brand: 'Rin', keywords: ['RIN BAR', 'RIN '], category: 'Household & Cleaning' },
  { brand: 'Wheel', keywords: ['WHEEL '], category: 'Household & Cleaning' },
  { brand: 'Ghadi', keywords: ['GHADI '], category: 'Household & Cleaning' },
  { brand: 'Henko', keywords: ['HENKO'], category: 'Household & Cleaning' },
  { brand: 'Comfort Fabric Conditioner', keywords: ['COMFORT '], category: 'Household & Cleaning' },
  { brand: 'Vanish', keywords: ['VANISH'], category: 'Household & Cleaning' },
  { brand: 'Ujala', keywords: ['UJALA'], category: 'Household & Cleaning' },
  { brand: 'Robin Blue', keywords: ['ROBIN BLUE'], category: 'Household & Cleaning' },
  { brand: 'Vim', keywords: ['VIM BAR', 'VIM LIQUID', 'VIM GEL', 'VIM '], category: 'Household & Cleaning' },
  { brand: 'Pril', keywords: ['PRIL '], category: 'Household & Cleaning' },
  { brand: 'Exo', keywords: ['EXO '], category: 'Household & Cleaning' },
  { brand: 'Scotch-Brite (3M)', keywords: ['SCOTCH BRITE', 'SCOTCHBRITE'], category: 'Household & Cleaning' },
  { brand: 'Harpic', keywords: ['HARPIC'], category: 'Household & Cleaning' },
  { brand: 'Lizol', keywords: ['LIZOL'], category: 'Household & Cleaning' },
  { brand: 'Domex', keywords: ['DOMEX'], category: 'Household & Cleaning' },
  { brand: 'Colin', keywords: ['COLIN '], category: 'Household & Cleaning' },
  { brand: 'Godrej Hit', keywords: ['KALA HIT', 'LAL HIT', 'HIT SPRAY'], category: 'Household & Cleaning' },
  { brand: 'Good Knight', keywords: ['GOOD KNIGHT', 'GOODKNIGHT'], category: 'Household & Cleaning' },
  { brand: 'All Out', keywords: ['ALL OUT', 'ALLOUT'], category: 'Household & Cleaning' },
  { brand: 'Baygon', keywords: ['BAYGON'], category: 'Household & Cleaning' },
  { brand: 'Mortein', keywords: ['MORTEIN'], category: 'Household & Cleaning' },
  { brand: 'Odonil', keywords: ['ODONIL'], category: 'Household & Cleaning' },
  { brand: 'Godrej Aer', keywords: ['AER POCKET', 'GODREJ AER', 'AER SPRAY'], category: 'Household & Cleaning' },
  { brand: 'Mangaldeep', keywords: ['MANGALDEEP', 'MANGAL DEEP'], category: 'Household & Cleaning' },
  { brand: 'Cycle Pure', keywords: ['CYCLE AGARBATTI', 'CYCLE PURE', 'LIA AGARBATTI'], category: 'Household & Cleaning' },
  { brand: 'Zed Black', keywords: ['ZED BLACK'], category: 'Household & Cleaning' },

  // Personal Care & Grooming
  { brand: 'Colgate', keywords: ['COLGATE'], category: 'Personal Care & Beauty' },
  { brand: 'Close-Up', keywords: ['CLOSE UP', 'CLOSEUP'], category: 'Personal Care & Beauty' },
  { brand: 'Pepsodent', keywords: ['PEPSODENT'], category: 'Personal Care & Beauty' },
  { brand: 'Sensodyne', keywords: ['SENSODYNE'], category: 'Personal Care & Beauty' },
  { brand: 'Oral-B', keywords: ['ORAL B', 'ORAL-B'], category: 'Personal Care & Beauty' },
  { brand: 'Dabur (Red / Meswak / Babool)', keywords: ['DABUR RED', 'MESWAK', 'BABOOL', 'DANT KANTI', 'DABUR '], category: 'Personal Care & Beauty' },
  { brand: 'Dettol', keywords: ['DETTOL'], category: 'Personal Care & Beauty' },
  { brand: 'Lifebuoy', keywords: ['LIFEBUOY'], category: 'Personal Care & Beauty' },
  { brand: 'Lux', keywords: ['LUX SOAP', 'LUX '], category: 'Personal Care & Beauty' },
  { brand: 'Dove', keywords: ['DOVE '], category: 'Personal Care & Beauty' },
  { brand: 'Santoor', keywords: ['SANTOOR'], category: 'Personal Care & Beauty' },
  { brand: 'Cinthol', keywords: ['CINTHOL'], category: 'Personal Care & Beauty' },
  { brand: 'Godrej No. 1', keywords: ['GODREJ NO 1', 'GODREJ NO.1'], category: 'Personal Care & Beauty' },
  { brand: 'Medimix', keywords: ['MEDIMIX'], category: 'Personal Care & Beauty' },
  { brand: 'Mysore Sandal', keywords: ['MYSORE SANDAL'], category: 'Personal Care & Beauty' },
  { brand: 'Pears', keywords: ['PEARS '], category: 'Personal Care & Beauty' },
  { brand: 'Fiama', keywords: ['FIAMA'], category: 'Personal Care & Beauty' },
  { brand: 'Vivel', keywords: ['VIVEL'], category: 'Personal Care & Beauty' },
  { brand: 'Nivea', keywords: ['NIVEA'], category: 'Personal Care & Beauty' },
  { brand: 'Vaseline', keywords: ['VASELINE'], category: 'Personal Care & Beauty' },
  { brand: 'Pond\'s', keywords: ['PONDS', 'POND\'S', 'POND '], category: 'Personal Care & Beauty' },
  { brand: 'Glow & Lovely', keywords: ['FAIR & LOVELY', 'GLOW & LOVELY', 'FAIR AND LOVELY', 'GLOW AND LOVELY'], category: 'Personal Care & Beauty' },
  { brand: 'Himalaya', keywords: ['HIMALAYA '], category: 'Personal Care & Beauty' },
  { brand: 'Joy', keywords: ['JOY '], category: 'Personal Care & Beauty' },
  { brand: 'Lakme', keywords: ['LAKME', 'LAKM '], category: 'Personal Care & Beauty' },
  { brand: 'Garnier', keywords: ['GARNIER'], category: 'Personal Care & Beauty' },
  { brand: 'L\'Oreal', keywords: ['LOREAL', 'L\'OREAL'], category: 'Personal Care & Beauty' },
  { brand: 'Clean & Clear', keywords: ['CLEAN & CLEAR', 'CLEAN AND CLEAR'], category: 'Personal Care & Beauty' },
  { brand: 'Head & Shoulders', keywords: ['HEAD & SHOULDERS', 'HEAD AND SHOULDERS'], category: 'Personal Care & Beauty' },
  { brand: 'Pantene', keywords: ['PANTENE'], category: 'Personal Care & Beauty' },
  { brand: 'Clinic Plus', keywords: ['CLINIC PLUS'], category: 'Personal Care & Beauty' },
  { brand: 'Sunsilk', keywords: ['SUNSILK'], category: 'Personal Care & Beauty' },
  { brand: 'Tresemme', keywords: ['TRESEMME'], category: 'Personal Care & Beauty' },
  { brand: 'Parachute (Marico)', keywords: ['PARACHUTE'], category: 'Personal Care & Beauty' },
  { brand: 'Bajaj Almond Drops', keywords: ['BAJAJ ALMOND', 'BAJAJ '], category: 'Personal Care & Beauty' },
  { brand: 'Navratna (Emami)', keywords: ['NAVRATNA'], category: 'Personal Care & Beauty' },
  { brand: 'Livon', keywords: ['LIVON '], category: 'Personal Care & Beauty' },
  { brand: 'Set Wet', keywords: ['SET WET'], category: 'Personal Care & Beauty' },
  { brand: 'Gillette', keywords: ['GILLETTE', 'MACH 3', 'VECTOR '], category: 'Personal Care & Beauty' },
  { brand: 'Old Spice', keywords: ['OLD SPICE'], category: 'Personal Care & Beauty' },
  { brand: 'Axe', keywords: ['AXE DEO', 'AXE SIGNATURE', 'AXE '], category: 'Personal Care & Beauty' },
  { brand: 'Wild Stone', keywords: ['WILD STONE', 'WILDSTONE'], category: 'Personal Care & Beauty' },
  { brand: 'Fogg', keywords: ['FOGG '], category: 'Personal Care & Beauty' },
  { brand: 'Engage', keywords: ['ENGAGE '], category: 'Personal Care & Beauty' },
  { brand: 'Park Avenue', keywords: ['PARK AVENUE'], category: 'Personal Care & Beauty' },
  { brand: 'Denver', keywords: ['DENVER '], category: 'Personal Care & Beauty' },
  { brand: 'Whisper', keywords: ['WHISPER'], category: 'Personal Care & Beauty' },
  { brand: 'Stayfree', keywords: ['STAYFREE', 'STAY FREE'], category: 'Personal Care & Beauty' },
  { brand: 'Sofy', keywords: ['SOFY '], category: 'Personal Care & Beauty' },

  // Baby Care
  { brand: 'Johnson\'s Baby', keywords: ['JOHNSON', 'JOHNSON\'S', 'JOHNSONS'], category: 'Baby Care' },
  { brand: 'Pampers', keywords: ['PAMPERS'], category: 'Baby Care' },
  { brand: 'Huggies', keywords: ['HUGGIES'], category: 'Baby Care' },
  { brand: 'MamyPoko', keywords: ['MAMY POKO', 'MAMYPOKO'], category: 'Baby Care' },
  { brand: 'Sebamed', keywords: ['SEBAMED'], category: 'Baby Care' },

  // OTC & Wellness
  { brand: 'Boroline / Suthol', keywords: ['BOROLINE', 'SUTHOL'], category: 'Personal Care & Beauty' },
  { brand: 'BoroPlus', keywords: ['BOROPLUS', 'BORO PLUS'], category: 'Personal Care & Beauty' },
  { brand: 'Vicks', keywords: ['VICKS', 'VAPORUB', 'INHALER'], category: 'Healthcare & OTC' },
  { brand: 'Eno', keywords: ['ENO '], category: 'Healthcare & OTC' },
  { brand: 'Moov', keywords: ['MOOV '], category: 'Healthcare & OTC' },
  { brand: 'Volini', keywords: ['VOLINI'], category: 'Healthcare & OTC' },
  { brand: 'Iodex', keywords: ['IODEX'], category: 'Healthcare & OTC' },
  { brand: 'Hajmola', keywords: ['HAJMOLA'], category: 'Healthcare & OTC' },
  { brand: 'Glucon-D', keywords: ['GLUCON D', 'GLUCON-D'], category: 'Healthcare & OTC' },
  { brand: 'Patanjali', keywords: ['PATANJALI'], category: 'Personal Care & Beauty' },

  // Kitchenware & Storage
  { brand: 'Milton', keywords: ['MILTON'], category: 'Plastics & Kitchenware' },
  { brand: 'Cello', keywords: ['CELLO '], category: 'Plastics & Kitchenware' },
  { brand: 'Tupperware', keywords: ['TUPPERWARE'], category: 'Plastics & Kitchenware' }
];

// Clean text for searching
function normalizeName(str) {
  return ` ${String(str || '').replace(/[^A-Za-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()} `.toUpperCase();
}

function identifyExactBrand(name) {
  const norm = normalizeName(name);

  for (const b of BRAND_RULES) {
    for (const kw of b.keywords) {
      const kwNorm = ` ${kw.trim()} `.toUpperCase();
      if (norm.includes(kwNorm)) {
        return { brand: b.brand, category: b.category };
      }
    }
  }
  return null;
}

function cleanString(str) {
  if (!str) return '';
  return String(str).replace(/\s+/g, ' ').trim();
}

function parseNumber(val, fallback = 0) {
  if (val === undefined || val === null || val === '') return fallback;
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? fallback : num;
}

async function main() {
  const inputPath = path.resolve(__dirname, '../main_data/ALL PRODUCT LIST.xlsx');
  console.log('Loading Excel workbook:', inputPath);

  const workbook = XLSX.readFile(inputPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  console.log(`Total rows in file: ${rows.length}`);

  const brandedItems = [];
  const brandSummary = {};
  const categorySummary = {};

  for (let i = 6; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[1]) continue;

    const rawName = cleanString(r[1]);
    if (!rawName || rawName === 'Name' || rawName.includes('Page No') || rawName.includes('Price List') || rawName.includes('SAI DARSHAN')) {
      continue;
    }

    // Match brand strictly from product name
    const match = identifyExactBrand(rawName);
    if (!match) continue;

    const pack = cleanString(r[2]);
    const mrp = parseNumber(r[4], 0);
    const newMrp = parseNumber(r[5], mrp);
    const srate = parseNumber(r[6], newMrp || mrp);
    const price = srate > 0 ? srate : (newMrp > 0 ? newMrp : mrp);

    brandedItems.push({
      name: rawName,
      brand: match.brand,
      category: match.category,
      pack: pack,
      mrp: mrp > 0 ? mrp : price,
      price: price > 0 ? price : mrp
    });

    brandSummary[match.brand] = (brandSummary[match.brand] || 0) + 1;
    categorySummary[match.category] = (categorySummary[match.category] || 0) + 1;
  }

  console.log('----------------------------------------------------');
  console.log(`✅ Total Genuine Branded Items Extracted: ${brandedItems.length.toLocaleString()}`);
  console.log('----------------------------------------------------');

  const sortedBrands = Object.entries(brandSummary).sort((a, b) => b[1] - a[1]);
  console.log(`Top ${Math.min(50, sortedBrands.length)} Genuine Brands:`);
  for (const [brand, count] of sortedBrands.slice(0, 50)) {
    console.log(`- ${brand.padEnd(35)}: ${count} items`);
  }

  console.log('\nBreakdown by Supermarket Category:');
  for (const [cat, count] of Object.entries(categorySummary).sort((a, b) => b[1] - a[1])) {
    console.log(`- ${cat.padEnd(25)}: ${count} items`);
  }

  // Generate BRANDED_PRODUCTS_CATALOG.xlsx
  const outPath = path.resolve(__dirname, '../main_data/BRANDED_PRODUCTS_CATALOG.xlsx');
  console.log(`\nWriting clean Branded Catalog to: ${outPath}`);

  const outputRows = [
    ['Product Name', 'Brand', 'Category', 'Pack Size', 'MRP (₹)', 'Sale Price (₹)']
  ];

  for (const item of brandedItems) {
    outputRows.push([
      item.name,
      item.brand,
      item.category,
      item.pack,
      item.mrp,
      item.price
    ]);
  }

  const outSheet = XLSX.utils.aoa_to_sheet(outputRows);
  const outWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(outWb, outSheet, 'Branded Products');
  XLSX.writeFile(outWb, outPath);

  console.log('🎉 Successfully generated BRANDED_PRODUCTS_CATALOG.xlsx!');
}

main().catch(console.error);
