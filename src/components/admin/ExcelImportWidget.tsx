import { useState, useRef, useMemo, type DragEvent, type ChangeEvent } from 'react';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import type { Category } from '../../types/category';
import type { ProductVariant } from '../../types/product';
import './ExcelImportWidget.css';

interface ExcelImportWidgetProps {
  categories: Category[];
  onImportComplete: () => void;
  onClose?: () => void;
}

export interface ParsedProductItem {
  id?: string;
  sku: string;
  name: string;
  pack: string;
  brand: string;
  mrp: number;
  price: number;
  category_id: string;
  category_name?: string;
  image_url?: string | null;
  variants?: ProductVariant[];
  stock_quantity?: number;
  is_available?: boolean;
  is_featured?: boolean;
}

interface RawExtractedRow {
  baseName: string;
  fullName: string;
  unitSize: string;
  brand: string;
  mrp: number;
  price: number;
  categoryId: string;
  categoryName: string;
  sku: string;
  imageUrl: string | null;
}

export function ExcelImportWidget({ categories, onImportComplete, onClose }: ExcelImportWidgetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedProductItem[]>([]);
  const [rawProducts, setRawProducts] = useState<RawExtractedRow[]>([]);
  const [groupVariants, setGroupVariants] = useState(true);

  // Search & Filter state for preview table
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(50);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 11 Granular Category Classification Rules matching Jabalpur Supermarket inventory
  const CATEGORY_RULES: { slug: string; namePattern: RegExp; keywords: string[] }[] = [
    {
      slug: 'baby-care',
      namePattern: /BABY/i,
      keywords: [
        'BABY', 'DIAPER', 'PAMPERS', 'HUGGIES', 'MAMY POKO', 'CERELAC', 'JOHNSON',
        'BABY WIPES', 'BABY POWDER', 'BABY SOAP', 'BABY OIL', 'LACTOGEN', 'NAN PRO',
        'NIPPLE', 'FEEDING BOTTLE', 'SEBAMED', 'HIMALAYA BABY'
      ]
    },
    {
      slug: 'beverages',
      namePattern: /BEVERAGE|DRINK|TEA|COFFEE/i,
      keywords: [
        'TEA', 'CHAI', 'COFFEE', 'JUICE', 'COLD DRINK', 'PEPSI', 'COKE', 'COCA', 'SPRITE',
        'THUMS UP', 'LIMCA', 'MIRINDA', '7UP', 'MAAZA', 'FROOTI', 'SLICE', 'BOURN VITA',
        'BOURNVITA', 'HORLICKS', 'COMPLAN', 'BOOST', 'SYRUP', 'WATER', 'SQUASH', 'CRANBERRY',
        'BEVERAGE', 'SODA', 'RED BULL', 'STING', 'ROOHAFZA', 'SHARBAT', 'ENERGY DRINK',
        'RASNA', 'TANG', 'MILKSHAKE', 'NESCAFE', 'BRU', 'TAJ MAHAL', 'RED LABEL', 'TATA TEA',
        'WAGH BAKRI', 'GOKUL TEA', 'REAL JUICE', 'MINUTE MAID', 'TROPICANA', 'BADAM MILK'
      ]
    },
    {
      slug: 'dairy-bakery',
      namePattern: /DAIRY|BAKERY|MILK/i,
      keywords: [
        'MILK', 'AMUL', 'BUTTER', 'PANEER', 'CHEESE', 'BREAD', 'CURD', 'DAIRY', 'GHEE',
        'EGG', 'DAHI', 'CHHAACH', 'BUTTERMILK', 'YOGURT', 'PAV', 'BUN', 'KHOA', 'MAWA',
        'TOAST', 'RUSK', 'GARLIC BREAD', 'PIZZA BASE', 'AMUL GOLD', 'AMUL TAAZA', 'AMUL COW'
      ]
    },
    {
      slug: 'snacks',
      namePattern: /SNACK|MUNCHIES|BISCUIT/i,
      keywords: [
        'BISCUIT', 'CHIPS', 'NAMKEEN', 'MAGGI', 'NOODLE', 'KURKURE', 'LAYS', 'CHIKKI',
        'CHOCOLATE', 'CADBURY', 'SWEET', 'CANDY', 'SNACK', 'BHUJIA', 'SEV', 'POPCORN',
        'WAFER', '50-50', 'MASKA', 'JELLY', 'CHOCLAIR', 'ECLAIR', 'TOFFEE', 'CRAX', 'BINGO',
        'PARLE', 'BRITANNIA', 'SUNFEAST', 'OREO', 'KITKAT', 'GEMS', 'SNICKERS', 'MUNCH',
        'PERK', 'LOLLIPOP', 'GUM', 'PASTA', 'MACARONI', 'CUP NOODLE', 'SOUP', 'MIXTURE',
        'GATHIYA', 'PAPAD', 'MARIE', 'MONACO', 'KRACKJACK', 'GOOD DAY', 'HIDE & SEEK',
        'BOURBON', 'TIGER', 'MILK BIKIS', 'BOUNCY', 'CHINGS', 'YIPPEE', 'TOP RAMEN',
        'HALDIRAM', 'BIKAJI', 'BALAJI', 'UNCLE CHIPPS', 'PRINGLES', 'DIET MIXTURE', 'CHANACHUR'
      ]
    },
    {
      slug: 'atta-rice-dals',
      namePattern: /ATTA|RICE|DAL|PULSE/i,
      keywords: [
        'ATTA', 'RICE', 'CHAWAL', 'DAL', 'PULSE', 'BESAN', 'SUJI', 'SOOJI', 'MAIDA', 'POHA',
        'GRAIN', 'WHEAT', 'MOONG', 'CHANA', 'TOOR', 'URAD', 'RAJMA', 'CHICKPEA', 'LENTIL',
        'ARHAR', 'MASOOR', 'DALLIA', 'SABUDANA', 'AASHIRVAAD', 'FORTUNE CHAKKI', 'DAAWAT',
        'KOHINOOR', 'INDIA GATE', 'BASMATI', 'KABULI', 'KALA CHANA', 'MATAR', 'LOBIA'
      ]
    },
    {
      slug: 'masalas-oils',
      namePattern: /OIL|MASALA|SPICE/i,
      keywords: [
        'OIL', 'MASALA', 'SPICE', 'SALT', 'SUGAR', 'MIRCH', 'HALDI', 'DHANIYA', 'JEERA',
        'MUSTARD', 'FORTUNE', 'SAFFOLA', 'SOYA OIL', 'SARSON', 'HING', 'GARAM', 'METHI',
        'AJWAIN', 'ELAICHI', 'CARDAMOM', 'CLOVE', 'LAUNG', 'TEJPATTA', 'CINNAMON', 'KASURI',
        'CHAT MASALA', 'SAMBHAR', 'BIRYANI', 'TASTEMAKER', 'MDH', 'EVEREST', 'CATCH',
        'BADSHAH', 'TATA SALT', 'DHARA', 'GEMINI', 'FREEDOM', 'TULSI SOYABEAN', 'SUNFLOWER OIL',
        'GROUNDNUT OIL', 'GULAB OIL', 'CHILLI POWDER', 'TURMERIC POWDER', 'CORIANDER POWDER'
      ]
    },
    {
      slug: 'household',
      namePattern: /HOUSEHOLD|CLEANING/i,
      keywords: [
        'SURF', 'DETERGENT', 'VIM', 'CLEANER', 'HARPIC', 'COLIN', 'WASHING', 'SOAP POWDER',
        'PHENYL', 'BROOM', 'MOSQUITO', 'ALL OUT', 'GOOD KNIGHT', 'COMFORT', 'TIDE', 'WHEEL',
        'RIN', 'ARIEL', 'DISHWASH', 'SCRUBBER', 'WIPER', 'POCHHA', 'HIT', 'BAYGON', 'ODONIL',
        'AIR FRESHENER', 'EXO', 'PRIL', 'LIZOL', 'DOMEX', 'TISSUE', 'NAPKIN', 'FOIL',
        'GARBAGE BAG', 'DRAIN CLEANER', 'BLEACH', 'TOILET CLEANER'
      ]
    },
    {
      slug: 'personal-care',
      namePattern: /PERSONAL|BEAUTY|CARE/i,
      keywords: [
        'SHAMPOO', 'SOAP', 'DETTOL', 'LIFEBUOY', 'DOVE', 'FACEWASH', 'CREAM', 'LOTION',
        'TOOTHPASTE', 'COLGATE', 'PEPSODENT', 'CLOSE UP', 'SENSODYNE', 'BRUSH', 'HAIR OIL',
        'PARACHUTE', 'BOROLINE', 'SUTHOL', 'POWDER', 'TALC', 'SHAVING', 'GILLETTE', 'RAZOR',
        'BLADE', 'VASELINE', 'FAIR & LOVELY', 'GLOW & LOVELY', 'NIVEA', 'HIMALAYA', 'SANITARY',
        'WHISPER', 'STAYFREE', 'DEO', 'DEODORANT', 'PERFUME', 'BODY WASH', 'HANDWASH',
        'PANTENE', 'CLINIC PLUS', 'SUNSILK', 'HEAD & SHOULDERS', 'LUX', 'SANTOOR', 'MEDIMIX',
        'CINTHOL', 'PEARS', 'FIAMA', 'WILD STONE', 'FOGG', 'AXE', 'DENVER', 'VICKS', 'IODEX',
        'MOOV', 'VOLINI', 'BAND-AID', 'COTTON', 'CONDITIONER', 'FACIAL', 'SCRUB', 'KAJAL'
      ]
    },
    {
      slug: 'kitchenware',
      namePattern: /PLASTIC|KITCHEN/i,
      keywords: [
        'PLASTIC', 'BOTTLE', 'CONTAINER', 'BUCKET', 'MUG', 'BOWL', 'STEEL', 'KITCHEN',
        'BOX', 'BASKET', 'TRAY', 'CASSEROLE', 'JUG', 'GLASS', 'SPOON', 'FORK', 'KNIFE',
        'CHOPPER', 'LIGHTER', 'ALUMINIUM', 'DUSTBIN', 'CELLO', 'MILTON', 'JAR', 'STORAGE'
      ]
    },
    {
      slug: 'pooja-essentials',
      namePattern: /POOJA/i,
      keywords: [
        'POOJA', 'AGARBATTI', 'MATCHBOX', 'KAPOOR', 'CAMPHOR', 'DIYA', 'DHOOP', 'RORI',
        'CHANDAN', 'SINDOOR', 'HAVAN', 'GANGADHAR', 'MANGALDEEP', 'ZED BLACK', 'CYCLE AGARBATTI'
      ]
    },
    {
      slug: 'dry-fruits-nuts',
      namePattern: /DRY FRUIT|NUTS/i,
      keywords: [
        'KAJU', 'CASHEW', 'BADAM', 'ALMOND', 'KISMIS', 'RAISIN', 'PISTA', 'PISTACHIO',
        'WALNUT', 'AKHROT', 'ANJEER', 'FIG', 'MAKHANA', 'FOX NUT', 'DRY FRUIT', 'CHESTNUT'
      ]
    }
  ];

  // Helper to accurately categorize product based on keywords or explicit category column
  const guessCategory = (name: string, brand: string, explicitCategory?: string): { id: string; name: string } => {
    // If the spreadsheet already had a category column, try to match by name or slug
    if (explicitCategory && explicitCategory.trim()) {
      const explicitNorm = explicitCategory.trim().toLowerCase();
      const directMatch = categories.find(c =>
        c.name.toLowerCase() === explicitNorm ||
        c.slug.toLowerCase() === explicitNorm ||
        c.name.toLowerCase().includes(explicitNorm) ||
        explicitNorm.includes(c.name.toLowerCase())
      );
      if (directMatch) {
        return { id: directMatch.id, name: directMatch.name };
      }
    }

    const text = (name + ' ' + (brand || '')).toUpperCase();

    for (const rule of CATEGORY_RULES) {
      if (rule.keywords.some(k => text.includes(k))) {
        const match = categories.find(c =>
          c.slug === rule.slug ||
          rule.namePattern.test(c.name)
        );
        if (match) return { id: match.id, name: match.name };
      }
    }

    // Default to general/snacks fallback
    const fallback = categories.find(c => c.slug === 'snacks' || /SNACK/i.test(c.name)) || categories[0];
    return {
      id: fallback?.id || 'general',
      name: fallback?.name || 'General Grocery'
    };
  };

  // Extract base product name and pack quantity for grouping variants
  const extractBaseNameAndPack = (fullName: string, packColumn: string) => {
    let cleanName = fullName.trim();
    let unitSize = (packColumn || '').trim();

    // Check if name ends with weight or unit (e.g. 500GM, 1KG, 250G, 330ML, 1L, 100G)
    const weightMatch = cleanName.match(/\s+([0-9]+(?:\.[0-9]+)?\s*(?:GM|G|KG|ML|L|LIT|PCS|N|TAB|PACK))\b/i);
    if (weightMatch) {
      if (!unitSize || unitSize === '1' || unitSize === '.' || unitSize === 'Pcs' || unitSize === 'PCS') {
        unitSize = weightMatch[1].trim();
      }
      cleanName = cleanName.replace(weightMatch[0], '').trim();
    }

    // Standardize unit size
    if (unitSize) {
      unitSize = unitSize
        .replace(/\bGM\b/gi, 'g')
        .replace(/\bG\b/gi, 'g')
        .replace(/\bKG\b/gi, 'kg')
        .replace(/\bML\b/gi, 'ml')
        .replace(/\bLIT\b/gi, 'L')
        .replace(/\bL\b/gi, 'L')
        .replace(/\bPCS\b/gi, 'pcs');
    } else {
      unitSize = '1 unit';
    }

    return { baseName: cleanName, unitSize };
  };

  // Convert raw parsed rows into either grouped variant cards or individual items
  const buildFinalItems = (rawList: RawExtractedRow[], shouldGroup: boolean): ParsedProductItem[] => {
    if (shouldGroup) {
      const groupedMap = new Map<string, ParsedProductItem>();

      rawList.forEach((item, index) => {
        const key = item.baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const existing = groupedMap.get(key);

        const variantObj: ProductVariant = {
          id: `v-${index + 1}`,
          unit_size: item.unitSize,
          price: item.price,
          mrp: item.mrp,
          stock_quantity: 50,
          is_available: true,
          sku: item.sku || `SDM-${index + 1000}`
        };

        if (existing) {
          if (!existing.variants) {
            existing.variants = [];
          }
          const hasVariant = existing.variants.some(
            v => v.unit_size.toLowerCase() === item.unitSize.toLowerCase()
          );
          if (!hasVariant) {
            existing.variants.push(variantObj);
            // Parent card tracks minimum active price
            if (item.price < existing.price) {
              existing.price = item.price;
              existing.mrp = item.mrp;
              existing.pack = item.unitSize;
            }
          }
          // If existing had no image and this variant has one, attach it
          if (!existing.image_url && item.imageUrl) {
            existing.image_url = item.imageUrl;
          }
        } else {
          groupedMap.set(key, {
            sku: item.sku || `SDM-${index + 1000}`,
            name: item.baseName,
            pack: item.unitSize,
            brand: item.brand,
            mrp: item.mrp,
            price: item.price,
            category_id: item.categoryId,
            category_name: item.categoryName,
            image_url: item.imageUrl || null,
            variants: [variantObj],
            stock_quantity: 50,
            is_available: true,
            is_featured: false
          });
        }
      });

      return Array.from(groupedMap.values());
    } else {
      return rawList.map((item, index) => ({
        sku: item.sku || `SDM-${index + 1000}`,
        name: item.fullName,
        pack: item.unitSize,
        brand: item.brand,
        mrp: item.mrp,
        price: item.price,
        category_id: item.categoryId,
        category_name: item.categoryName,
        image_url: item.imageUrl || null,
        stock_quantity: 50,
        is_available: true,
        is_featured: false,
        variants: [
          {
            id: `v-${index + 1}`,
            unit_size: item.unitSize,
            price: item.price,
            mrp: item.mrp,
            stock_quantity: 50,
            is_available: true,
            sku: item.sku || `SDM-${index + 1000}`
          }
        ]
      }));
    }
  };

  const parseExcelFile = (file: File) => {
    setFileName(file.name);
    const sizeInKB = (file.size / 1024).toFixed(1);
    setFileSizeStr(`${sizeInKB} KB`);
    setIsProcessing(true);
    setStatusMessage('Reading spreadsheet data...');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx');
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        if (!rawRows || rawRows.length === 0) {
          throw new Error('Spreadsheet appears to be empty.');
        }

        // 1. Locate header row dynamically across first 15 rows
        let headerRowIdx = -1;
        let colSku = -1;
        let colName = -1;
        let colPack = -1;
        let colBrand = -1;
        let colCategory = -1;
        let colMrp = -1;
        let colPrice = -1;
        let colImage = -1;

        for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
          const row = rawRows[r] || [];
          for (let c = 0; c < row.length; c++) {
            const val = String(row[c] || '').trim().toLowerCase();

            // SKU detection
            if (val === 'sku' || val === 'item code' || val === 'barcode' || val === 'product id' || val === 'code') {
              colSku = c;
            }
            // Product Name detection
            if (
              val === 'name' || val === 'item name' || val === 'product name' ||
              val === 'store product name' || val === 'description' || val === 'title'
            ) {
              colName = c;
            }
            // Pack / Unit size detection
            if (val === 'pack' || val === 'unit' || val === 'pack size' || val === 'unit size' || val === 'weight' || val === 'size') {
              colPack = c;
            }
            // Brand detection
            if (val === 'brand' || val === 'company' || val === 'mfg' || val === 'brand name') {
              colBrand = c;
            }
            // Category detection
            if (val === 'category' || val === 'category name' || val === 'department' || val === 'dept' || val === 'group') {
              colCategory = c;
            }
            // MRP detection
            if (val === 'mrp' || val === 'mrp (₹)' || val === 'new-mrp' || val === 'max retail price' || val === 'marked price') {
              colMrp = c;
            }
            // Selling Price / Sale Rate detection
            if (
              val === 'selling price (₹)' || val === 'selling price' || val === 'sale rate' ||
              val === 'sale price' || val === 'srate' || val === 'active rates' ||
              val === 'price' || val === 'rate' || val === 'sp'
            ) {
              colPrice = c;
            }
            // Image URL detection
            if (
              val === 'direct product image url' || val === 'image url' ||
              val === 'image' || val === 'img' || val === 'photo'
            ) {
              colImage = c;
            }
          }

          // If we found name and at least one price column, this is our header row
          if (colName !== -1 && (colMrp !== -1 || colPrice !== -1)) {
            headerRowIdx = r;
            break;
          }
        }

        // Fallback column positions if standard store format without recognizable headers
        if (headerRowIdx === -1) {
          headerRowIdx = 5;
          colName = 1;
          colPack = 2;
          colBrand = 3;
          colMrp = 4;
          colPrice = 5;
        }

        setStatusMessage('Extracting products, categorizing, and normalizing units...');

        // 2. Parse product rows
        const rawProductList: RawExtractedRow[] = [];

        for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row) continue;

          const rawName = String(row[colName] || '').trim();
          const firstVal = String(row[0] || '').trim();

          // Ignore banners, page headers, or blank lines
          if (
            !rawName ||
            rawName.toLowerCase() === 'name' ||
            rawName.toLowerCase() === 'product name' ||
            firstVal.includes('SAI DARSHAN') ||
            firstVal.includes('Price List') ||
            firstVal.includes('Page No.') ||
            firstVal.includes('Total') ||
            firstVal.includes('Grand Total')
          ) {
            continue;
          }

          const rawSku = colSku !== -1 ? String(row[colSku] || '').trim() : '';
          const rawPack = colPack !== -1 ? String(row[colPack] || '').trim() : '';
          const rawBrand = colBrand !== -1 ? String(row[colBrand] || '').trim() : '';
          const explicitCat = colCategory !== -1 ? String(row[colCategory] || '').trim() : '';

          // Parse MRP number
          let mrp = 0;
          if (colMrp !== -1 && row[colMrp] !== undefined) {
            const rawMrpStr = String(row[colMrp]).replace(/[^0-9.]/g, '');
            mrp = parseFloat(rawMrpStr) || 0;
          }

          // Parse Selling Price number (handles multiple rates like "134, 137")
          let srate = 0;
          if (colPrice !== -1 && row[colPrice] !== undefined) {
            const rawPriceStr = String(row[colPrice]).split(',')[0].replace(/[^0-9.]/g, '');
            srate = parseFloat(rawPriceStr) || 0;
          }

          // Anomaly checks
          if (srate > 100000) srate = mrp; // Corrupted POS barcode in price column
          if (srate === 0 && mrp > 0) srate = mrp;
          if (mrp === 0 && srate > 0) mrp = srate;
          if (mrp > 0 && srate > mrp) mrp = srate; // Ensure MRP is never lower than sale rate

          // Skip completely unpriced rows
          if (mrp === 0 && srate === 0) continue;

          // Parse Image URL if available
          let imageUrl: string | null = null;
          if (colImage !== -1 && row[colImage]) {
            const rawImg = String(row[colImage]).trim();
            if (rawImg.startsWith('http://') || rawImg.startsWith('https://')) {
              imageUrl = rawImg;
            }
          }

          const { baseName, unitSize } = extractBaseNameAndPack(rawName, rawPack);
          const category = guessCategory(rawName, rawBrand, explicitCat);

          rawProductList.push({
            sku: rawSku || `SDM-${r + 100}`,
            baseName,
            fullName: rawName,
            unitSize,
            brand: rawBrand,
            mrp,
            price: srate,
            categoryId: category.id,
            categoryName: category.name,
            imageUrl
          });
        }

        if (rawProductList.length === 0) {
          throw new Error('No valid product rows could be detected in this sheet. Please check file columns.');
        }

        setRawProducts(rawProductList);
        const finalItems = buildFinalItems(rawProductList, groupVariants);
        setParsedItems(finalItems);
        setCurrentPage(1);
        setIsProcessing(false);
        setStatusMessage(null);
      } catch (err: any) {
        console.error('Excel parse error:', err);
        alert('Failed to parse Excel file: ' + (err.message || 'Unknown error'));
        setIsProcessing(false);
        setStatusMessage(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      parseExcelFile(files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      parseExcelFile(files[0]);
    }
  };

  // Remove a single product from the parsed list
  const handleRemoveItem = (indexToRemove: number) => {
    setParsedItems(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Bulk upload parsed products to Supabase in batches of 100
  const handleBulkUpload = async () => {
    if (parsedItems.length === 0) return;
    if (!isSupabaseConfigured) {
      alert('Supabase is not configured yet. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to upload live data.');
      return;
    }

    setIsUploading(true);
    setProgressPercent(0);
    setStatusMessage('Preparing batch sync to Supabase database...');

    const batchSize = 100;
    const totalBatches = Math.ceil(parsedItems.length / batchSize);
    let successfulCount = 0;
    const errors: string[] = [];

    try {
      for (let b = 0; b < totalBatches; b++) {
        const start = b * batchSize;
        const end = Math.min(start + batchSize, parsedItems.length);
        const batch = parsedItems.slice(start, end);

        const payload = batch.map((item, i) => ({
          sku: item.sku || `SDM-${start + i + 100}`,
          name: item.name,
          brand: item.brand || null,
          category_id: item.category_id || categories[0]?.id || null,
          price: item.price,
          mrp: item.mrp || item.price,
          unit_size: item.pack || '1 unit',
          stock_quantity: item.stock_quantity ?? 50,
          is_available: true,
          is_featured: false,
          is_archived: false,
          image_url: item.image_url || null,
          variants: item.variants || [],
          description: `${item.name} available for fast same-day delivery at Sai Darshan Shopping Mart Jabalpur.`,
          updated_at: new Date().toISOString()
        }));

        const { error } = await withTimeout(
          supabase.from('products').upsert(payload, { onConflict: 'sku' }),
          12000
        );

        if (error) {
          console.warn(`Batch ${b + 1} warning:`, error.message);
          errors.push(`Batch ${b + 1}: ${error.message}`);
        } else {
          successfulCount += batch.length;
        }

        const pct = Math.round(((b + 1) / totalBatches) * 100);
        setProgressPercent(pct);
        setStatusMessage(`Syncing batch ${b + 1} of ${totalBatches} (${successfulCount} / ${parsedItems.length} products saved)...`);
      }

      if (errors.length > 0 && successfulCount === 0) {
        alert(`Sync failed: \n${errors.slice(0, 3).join('\n')}`);
      } else {
        alert(`🎉 Success! Successfully imported & synced ${successfulCount} products with content quantity variants into store catalog.`);
        onImportComplete();
        if (onClose) onClose();
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      alert('Upload interrupted: ' + (err.message || 'Network error'));
    } finally {
      setIsUploading(false);
      setStatusMessage(null);
    }
  };

  // Filtered items based on search query and category filter
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return parsedItems.filter(item => {
      const matchesSearch = !q ||
        item.name.toLowerCase().includes(q) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        (item.pack && item.pack.toLowerCase().includes(q));

      const matchesCat = !selectedCategoryFilter || item.category_id === selectedCategoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [parsedItems, searchQuery, selectedCategoryFilter]);

  // Paginated items for smooth rendering of thousands of rows
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const displayedItems = useMemo(() => {
    if (pageSize === 'all') return filteredItems;
    const start = (safePage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, safePage, pageSize]);

  // Summary statistics
  const totalQuantityOptions = useMemo(() => {
    return parsedItems.reduce((acc, p) => acc + (p.variants?.length || 1), 0);
  }, [parsedItems]);

  const itemsWithImagesCount = useMemo(() => {
    return parsedItems.filter(p => !!p.image_url).length;
  }, [parsedItems]);

  const uniqueCategoriesCount = useMemo(() => {
    const set = new Set(parsedItems.map(p => p.category_id));
    return set.size;
  }, [parsedItems]);

  return (
    <div className="excel-import-widget">
      {/* 1. Drag & Drop File Upload Area */}
      {!parsedItems.length && !isProcessing && (
        <div
          className={`excel-dropzone ${isDragging ? 'excel-dropzone--active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          tabIndex={0}
          role="button"
          aria-label="Upload excel file"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls, .csv"
            style={{ display: 'none' }}
          />
          <div className="excel-dropzone__icon-circle">
            <span className="material-symbols-outlined excel-dropzone__icon">upload_file</span>
          </div>
          <div className="excel-dropzone__title">Drag & Drop Excel Product Spreadsheet</div>
          <div className="excel-dropzone__subtitle">
            Upload your supermarket product list or sales register (.xlsx, .xls, .csv).
            Automatically extracts names, packs, rates, images, and maps categories.
          </div>
          <div className="excel-dropzone__badges">
            <span className="excel-badge">EXCEL .XLSX</span>
            <span className="excel-badge">EXCEL .XLS</span>
            <span className="excel-badge">CSV FILES</span>
            <span className="excel-badge">AUTO-ANOMALY CLEANING</span>
            <span className="excel-badge">CONTENT QUANTITY GROUPING</span>
          </div>
        </div>
      )}

      {/* 2. Processing Spinner */}
      {isProcessing && (
        <div className="excel-processing-state">
          <div className="material-symbols-outlined excel-spin-icon">
            sync
          </div>
          <h3 className="excel-processing-title">Analyzing Spreadsheet & Normalizing Catalog...</h3>
          <p className="excel-processing-desc">{statusMessage}</p>
        </div>
      )}

      {/* 3. Parsed Catalog Preview & Full Item Listing */}
      {parsedItems.length > 0 && (
        <div className="excel-preview">
          {/* File Header Bar */}
          <div className="excel-file-info">
            <div className="excel-file-info__meta">
              <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-primary)', fontSize: '24px' }}>
                description
              </span>
              <div>
                <span className="excel-file-info__name">{fileName}</span>
                {fileSizeStr && <span className="excel-file-info__size">({fileSizeStr})</span>}
              </div>
            </div>
            <button
              type="button"
              className="sdm-btn sdm-btn--outlined excel-btn--small"
              onClick={() => {
                setParsedItems([]);
                setRawProducts([]);
                setFileName(null);
                setSearchQuery('');
                setSelectedCategoryFilter('');
              }}
              disabled={isUploading}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>swap_horiz</span>
              <span>Change File</span>
            </button>
          </div>

          {/* Quick Metrics Cards */}
          <div className="excel-preview__stats">
            <div className="excel-stat-card">
              <span className="excel-stat-card__value">{parsedItems.length.toLocaleString()}</span>
              <span className="excel-stat-card__label">Total Products</span>
            </div>
            <div className="excel-stat-card">
              <span className="excel-stat-card__value">{totalQuantityOptions.toLocaleString()}</span>
              <span className="excel-stat-card__label">Pack Variants</span>
            </div>
            <div className="excel-stat-card">
              <span className="excel-stat-card__value">{uniqueCategoriesCount}</span>
              <span className="excel-stat-card__label">Categories Mapped</span>
            </div>
            <div className="excel-stat-card">
              <span className="excel-stat-card__value">{itemsWithImagesCount.toLocaleString()}</span>
              <span className="excel-stat-card__label">With Photos</span>
            </div>
          </div>

          {/* Controls: Search, Category Filter, Variant Grouping Toggle */}
          <div className="excel-controls-bar">
            <div className="excel-search-box">
              <span className="material-symbols-outlined excel-search-box__icon">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search parsed items by name, brand, SKU..."
                className="excel-search-box__input"
                disabled={isUploading}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="excel-search-box__clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </button>
              )}
            </div>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => {
                setSelectedCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="excel-filter-select"
              disabled={isUploading}
            >
              <option value="">All Categories ({parsedItems.length})</option>
              {categories.map((c) => {
                const count = parsedItems.filter(p => p.category_id === c.id).length;
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} ({count})
                  </option>
                );
              })}
            </select>

            <label className="excel-group-checkbox">
              <input
                type="checkbox"
                checked={groupVariants}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setGroupVariants(isChecked);
                  if (rawProducts.length > 0) {
                    setParsedItems(buildFinalItems(rawProducts, isChecked));
                    setCurrentPage(1);
                  }
                }}
                disabled={isUploading}
              />
              <span>Group pack variants (100g, 250g, 500g)</span>
            </label>
          </div>

          {/* Table Header Counter and Pagination Top */}
          <div className="excel-list-header">
            <div className="excel-list-counter">
              Showing <strong>{filteredItems.length > 0 ? (pageSize === 'all' ? 1 : (safePage - 1) * pageSize + 1) : 0}</strong> -{' '}
              <strong>{pageSize === 'all' ? filteredItems.length : Math.min(safePage * pageSize, filteredItems.length)}</strong> of{' '}
              <strong>{filteredItems.length.toLocaleString()}</strong> items
              {filteredItems.length !== parsedItems.length && ` (filtered from ${parsedItems.length.toLocaleString()})`}
            </div>

            <div className="excel-page-size-selector">
              <span>Per page:</span>
              {[25, 50, 100, 200].map(size => (
                <button
                  key={size}
                  type="button"
                  className={`excel-page-size-btn ${pageSize === size ? 'excel-page-size-btn--active' : ''}`}
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  disabled={isUploading}
                >
                  {size}
                </button>
              ))}
              <button
                type="button"
                className={`excel-page-size-btn ${pageSize === 'all' ? 'excel-page-size-btn--active' : ''}`}
                onClick={() => {
                  setPageSize('all');
                  setCurrentPage(1);
                }}
                disabled={isUploading}
              >
                All
              </button>
            </div>
          </div>

          {/* Full Interactive Products Table */}
          <div className="excel-preview__table-wrapper">
            <table className="excel-preview__table">
              <thead>
                <tr>
                  <th style={{ width: '48px', textAlign: 'center' }}>#</th>
                  <th style={{ width: '56px' }}>Image</th>
                  <th>Product Name & Brand</th>
                  <th>Pack / Variant Options</th>
                  <th style={{ textAlign: 'right' }}>MRP</th>
                  <th style={{ textAlign: 'right' }}>Sale Price</th>
                  <th style={{ textAlign: 'center' }}>Discount</th>
                  <th>Department</th>
                  <th style={{ width: '44px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: '8px', display: 'block' }}>
                        inventory_2
                      </span>
                      No products match your current search/filter.
                    </td>
                  </tr>
                ) : (
                  displayedItems.map((item, idx) => {
                    const globalIdx = pageSize === 'all' ? idx + 1 : (safePage - 1) * pageSize + idx + 1;
                    const discountPct = item.mrp > item.price ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;
                    const catObj = categories.find(c => c.id === item.category_id);

                    return (
                      <tr key={item.sku + idx}>
                        <td style={{ textAlign: 'center', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.8rem' }}>
                          {globalIdx}
                        </td>
                        <td>
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="excel-item-thumb"
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="excel-item-thumb-placeholder">
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>shopping_basket</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--md-sys-color-on-surface)', lineHeight: 1.3 }}>
                            {item.name}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                            {item.brand && (
                              <span className="excel-brand-badge">{item.brand}</span>
                            )}
                            <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
                              {item.sku}
                            </span>
                          </div>
                        </td>
                        <td>
                          {item.variants && item.variants.length > 1 ? (
                            <div className="excel-variants-pill" title={item.variants.map(v => `${v.unit_size}: ₹${v.price}`).join(', ')}>
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>tune</span>
                              <span>{item.variants.length} options ({item.variants.map(v => v.unit_size).join(', ')})</span>
                            </div>
                          ) : (
                            <span className="excel-pack-text">{item.pack || '1 unit'}</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--md-sys-color-outline)', textDecoration: discountPct > 0 ? 'line-through' : 'none' }}>
                          ₹{item.mrp}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--md-sys-color-primary)' }}>
                          ₹{item.price}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {discountPct > 0 ? (
                            <span className="excel-discount-badge">-{discountPct}%</span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>0%</span>
                          )}
                        </td>
                        <td>
                          <span className="excel-category-badge">
                            {catObj?.name || item.category_name || 'General Grocery'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="excel-row-remove-btn"
                            onClick={() => handleRemoveItem(globalIdx - 1)}
                            title="Exclude this item from import"
                            disabled={isUploading}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Pagination Controls */}
          {totalPages > 1 && pageSize !== 'all' && (
            <div className="excel-pagination-bar">
              <button
                type="button"
                className="excel-page-btn"
                onClick={() => setCurrentPage(1)}
                disabled={safePage <= 1 || isUploading}
                title="First Page"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>first_page</span>
              </button>
              <button
                type="button"
                className="excel-page-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1 || isUploading}
                title="Previous Page"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
              </button>
              <span className="excel-page-indicator">
                Page <strong>{safePage}</strong> of <strong>{totalPages}</strong>
              </span>
              <button
                type="button"
                className="excel-page-btn"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages || isUploading}
                title="Next Page"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
              </button>
              <button
                type="button"
                className="excel-page-btn"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage >= totalPages || isUploading}
                title="Last Page"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>last_page</span>
              </button>
            </div>
          )}

          {/* Real-time Upload Progress Bar */}
          {isUploading && (
            <div className="excel-progress">
              <div className="excel-progress__header">
                <span>{statusMessage}</span>
                <span style={{ fontWeight: 700, color: 'var(--md-sys-color-primary)' }}>{progressPercent}%</span>
              </div>
              <div className="excel-progress__track">
                <div className="excel-progress__bar" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}

          {/* Bottom Action Buttons */}
          <div className="excel-preview__actions">
            {onClose && (
              <button
                type="button"
                className="sdm-btn sdm-btn--outlined"
                onClick={onClose}
                disabled={isUploading}
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              className="sdm-btn sdm-btn--primary excel-sync-btn"
              onClick={handleBulkUpload}
              disabled={isUploading || parsedItems.length === 0}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                {isUploading ? 'sync' : 'cloud_upload'}
              </span>
              <span>
                {isUploading
                  ? 'Syncing to Supabase Database...'
                  : `Save & Sync All ${parsedItems.length.toLocaleString()} Products to Store`}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
