import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { supabase, isSupabaseConfigured, withTimeout } from '../../lib/supabase';
import type { Category } from '../../types/category';
import type { ProductVariant } from '../../types/product';
import './ExcelImportWidget.css';

interface ExcelImportWidgetProps {
  categories: Category[];
  onImportComplete: () => void;
  onClose?: () => void;
}

interface ParsedProductItem {
  name: string;
  pack: string;
  brand: string;
  mrp: number;
  price: number;
  sku: string;
  category_id: string;
  variants?: ProductVariant[];
}

export function ExcelImportWidget({ categories, onImportComplete, onClose }: ExcelImportWidgetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedProductItem[]>([]);
  const [rawProducts, setRawProducts] = useState<any[]>([]);
  const [groupVariants, setGroupVariants] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Robust category classification rules
  const CATEGORY_RULES: { slug: string; namePattern: RegExp; keywords: string[] }[] = [
    {
      slug: 'baby-care',
      namePattern: /BABY/i,
      keywords: [
        'BABY', 'DIAPER', 'PAMPERS', 'HUGGIES', 'MAMY POKO', 'CERELAC', 'JOHNSON',
        'BABY WIPES', 'BABY POWDER', 'BABY SOAP', 'BABY OIL', 'LACTOGEN', 'NAN PRO',
        'NIPPLE', 'FEEDING BOTTLE', 'SEBAMED'
      ]
    },
    {
      slug: 'beverages',
      namePattern: /BEVERAGE|DRINK/i,
      keywords: [
        'TEA', 'CHAI', 'COFFEE', 'JUICE', 'COLD DRINK', 'PEPSI', 'COKE', 'COCA', 'SPRITE',
        'THUMS UP', 'LIMCA', 'MIRINDA', '7UP', 'MAAZA', 'FROOTI', 'SLICE', 'BOURN VITA',
        'BOURNVITA', 'HORLICKS', 'COMPLAN', 'BOOST', 'SYRUP', 'WATER', 'SQUASH', 'CRANBERRY',
        'BEVERAGE', 'SODA', 'RED BULL', 'STING', 'ROOHAFZA', 'SHARBAT', 'ENERGY DRINK',
        'RASNA', 'TANG', 'MILKSHAKE', 'NESCAFE', 'BRU', 'TAJ MAHAL', 'RED LABEL', 'TATA TEA'
      ]
    },
    {
      slug: 'dairy-bakery',
      namePattern: /DAIRY|BAKERY/i,
      keywords: [
        'MILK', 'AMUL', 'BUTTER', 'PANEER', 'CHEESE', 'BREAD', 'CURD', 'DAIRY', 'GHEE',
        'EGG', 'DAHI', 'CHHAACH', 'BUTTERMILK', 'YOGURT', 'PAV', 'BUN', 'KHOA', 'MAWA'
      ]
    },
    {
      slug: 'snacks',
      namePattern: /SNACK|MUNCHIES/i,
      keywords: [
        'BISCUIT', 'CHIPS', 'NAMKEEN', 'MAGGI', 'NOODLE', 'KURKURE', 'LAYS', 'CHIKKI',
        'CHOCOLATE', 'CADBURY', 'SWEET', 'CANDY', 'SNACK', 'BHUJIA', 'SEV', 'POPCORN',
        'WAFER', '50-50', 'MASKA', 'JELLY', 'CHOCLAIR', 'ECLAIR', 'TOFFEE', 'CRAX', 'BINGO',
        'PARLE', 'BRITANNIA', 'SUNFEAST', 'OREO', 'KITKAT', 'GEMS', 'SNICKERS', 'MUNCH',
        'PERK', 'LOLLIPOP', 'GUM', 'PASTA', 'MACARONI', 'CUP NOODLE', 'SOUP', 'MIXTURE',
        'GATHIYA', 'PAPAD', 'RUSK', 'TOAST', 'MARIE', 'MONACO', 'KRACKJACK', 'GOOD DAY',
        'HIDE & SEEK', 'BOURBON', 'TIGER', 'MILK BIKIS', 'BOUNCY', 'CHINGS', 'YIPPEE',
        'TOP RAMEN', 'HALDIRAM', 'BIKAJI', 'BALAJI', 'UNCLE CHIPPS'
      ]
    },
    {
      slug: 'atta-rice-dals',
      namePattern: /ATTA|RICE|DAL/i,
      keywords: [
        'ATTA', 'RICE', 'CHAWAL', 'DAL', 'PULSE', 'BESAN', 'SUJI', 'SOOJI', 'MAIDA', 'POHA',
        'GRAIN', 'WHEAT', 'MOONG', 'CHANA', 'TOOR', 'URAD', 'RAJMA', 'CHICKPEA', 'LENTIL',
        'ARHAR', 'MASOOR', 'DALLIA', 'SABUDANA', 'AASHIRVAAD', 'FORTUNE CHAKKI', 'DAAWAT',
        'KOHINOOR', 'INDIA GATE', 'BASMATI'
      ]
    },
    {
      slug: 'masalas-oils',
      namePattern: /OIL|MASALA/i,
      keywords: [
        'OIL', 'MASALA', 'SPICE', 'SALT', 'SUGAR', 'MIRCH', 'HALDI', 'DHANIYA', 'JEERA',
        'MUSTARD', 'FORTUNE', 'SAFFOLA', 'SOYA OIL', 'SARSON', 'HING', 'GARAM', 'METHI',
        'AJWAIN', 'ELAICHI', 'CARDAMOM', 'CLOVE', 'LAUNG', 'TEJPATTA', 'CINNAMON', 'KASURI',
        'CHAT MASALA', 'SAMBHAR', 'BIRYANI', 'TASTEMAKER', 'MDH', 'EVEREST', 'CATCH',
        'BADSHAH', 'TATA SALT', 'DHARA', 'GEMINI', 'FREEDOM'
      ]
    },
    {
      slug: 'household',
      namePattern: /HOUSEHOLD|CLEANING/i,
      keywords: [
        'SURF', 'DETERGENT', 'VIM', 'CLEANER', 'HARPIC', 'COLIN', 'WASHING', 'SOAP POWDER',
        'PHENYL', 'BROOM', 'POOJA', 'AGARBATTI', 'MOSQUITO', 'ALL OUT', 'GOOD KNIGHT',
        'COMFORT', 'TIDE', 'WHEEL', 'RIN', 'ARIEL', 'DISHWASH', 'SCRUBBER', 'WIPER',
        'POCHHA', 'HIT', 'BAYGON', 'ODONIL', 'AIR FRESHENER', 'MATCHBOX', 'KAPOOR', 'DIYA',
        'EXO', 'PRIL', 'LIZOL', 'DOMEX'
      ]
    },
    {
      slug: 'personal-care',
      namePattern: /PERSONAL|BEAUTY/i,
      keywords: [
        'SHAMPOO', 'SOAP', 'DETTOL', 'LIFEBUOY', 'DOVE', 'FACEWASH', 'CREAM', 'LOTION',
        'TOOTHPASTE', 'COLGATE', 'PEPSODENT', 'CLOSE UP', 'SENSODYNE', 'BRUSH', 'HAIR OIL',
        'PARACHUTE', 'BOROLINE', 'SUTHOL', 'POWDER', 'TALC', 'SHAVING', 'GILLETTE', 'RAZOR',
        'BLADE', 'VASELINE', 'FAIR & LOVELY', 'GLOW & LOVELY', 'NIVEA', 'HIMALAYA', 'SANITARY',
        'WHISPER', 'STAYFREE', 'DEO', 'DEODORANT', 'PERFUME', 'BODY WASH', 'HANDWASH',
        'PANTENE', 'CLINIC PLUS', 'SUNSILK', 'HEAD & SHOULDERS', 'LUX', 'SANTOOR', 'MEDIMIX',
        'CINTHOL', 'PEARS', 'FIAMA', 'WILD STONE', 'FOGG', 'AXE', 'DENVER', 'VICKS', 'IODEX',
        'MOOV', 'VOLINI', 'BAND-AID', 'COTTON'
      ]
    },
    {
      slug: 'kitchenware',
      namePattern: /PLASTIC|KITCHEN/i,
      keywords: [
        'PLASTIC', 'BOTTLE', 'CONTAINER', 'BUCKET', 'MUG', 'BOWL', 'STEEL', 'KITCHEN',
        'BOX', 'BASKET', 'TRAY', 'CASSEROLE', 'JUG', 'GLASS', 'SPOON', 'FORK', 'KNIFE',
        'CHOPPER', 'LIGHTER', 'FOIL', 'ALUMINIUM', 'DUSTBIN', 'CELLO', 'MILTON'
      ]
    }
  ];

  // Helper to accurately categorize product based on keywords
  const guessCategoryId = (name: string, brand: string): string => {
    const text = (name + ' ' + (brand || '')).toUpperCase();

    for (const rule of CATEGORY_RULES) {
      if (rule.keywords.some(k => text.includes(k))) {
        const match = categories.find(c =>
          c.slug === rule.slug ||
          rule.namePattern.test(c.name)
        );
        if (match) return match.id;
      }
    }

    // Default to Snacks & Munchies (general packaged groceries)
    const fallback = categories.find(c => c.slug === 'snacks' || /SNACK/i.test(c.name)) || categories[0];
    return fallback?.id || 'general';
  };

  // Extract base product name and pack quantity for grouping variants
  const extractBaseNameAndPack = (fullName: string, packColumn: string) => {
    let cleanName = fullName.trim();
    let unitSize = packColumn.trim();

    // Check if name ends with weight (e.g. 500GM, 1KG, 250G, 330ML, 100G)
    const weightMatch = cleanName.match(/\s+([0-9]+(?:\.[0-9]+)?\s*(?:GM|G|KG|ML|L|PCS|N|TAB))\b/i);
    if (weightMatch) {
      if (!unitSize || unitSize === '1' || unitSize === '.' || unitSize === 'Pcs') {
        unitSize = weightMatch[1].trim();
      }
      cleanName = cleanName.replace(weightMatch[0], '').trim();
    }

    // Standardize unit size
    if (unitSize) {
      unitSize = unitSize.replace(/GM/i, 'g').replace(/KG/i, 'kg').replace(/ML/i, 'ml').replace(/PCS/i, 'pcs');
    } else {
      unitSize = '1 unit';
    }

    return { baseName: cleanName, unitSize };
  };

  // Convert raw parsed rows into either grouped variant cards or individual items
  const buildFinalItems = (rawList: any[], shouldGroup: boolean): ParsedProductItem[] => {
    if (shouldGroup) {
      const groupedMap = new Map<string, ParsedProductItem>();

      rawList.forEach((item, index) => {
        const key = item.baseName.toLowerCase();
        const existing = groupedMap.get(key);

        const variantObj: ProductVariant = {
          id: `v-${index + 1}`,
          unit_size: item.unitSize,
          price: item.price,
          mrp: item.mrp,
          stock_quantity: 50,
          is_available: true,
          sku: `SDM-${index + 1000}`
        };

        if (existing) {
          if (!existing.variants) {
            existing.variants = [];
          }
          const hasVariant = existing.variants.some(v => v.unit_size.toLowerCase() === item.unitSize.toLowerCase());
          if (!hasVariant) {
            existing.variants.push(variantObj);
            // Minimum available price
            if (item.price < existing.price) {
              existing.price = item.price;
              existing.mrp = item.mrp;
              existing.pack = item.unitSize;
            }
          }
        } else {
          groupedMap.set(key, {
            name: item.baseName,
            pack: item.unitSize,
            brand: item.brand,
            mrp: item.mrp,
            price: item.price,
            sku: `SDM-${index + 1000}`,
            category_id: item.categoryId,
            variants: [variantObj]
          });
        }
      });

      return Array.from(groupedMap.values());
    } else {
      return rawList.map((item, index) => ({
        name: item.fullName,
        pack: item.unitSize,
        brand: item.brand,
        mrp: item.mrp,
        price: item.price,
        sku: `SDM-${index + 1000}`,
        category_id: item.categoryId,
        variants: [
          {
            id: `v-${index + 1}`,
            unit_size: item.unitSize,
            price: item.price,
            mrp: item.mrp,
            stock_quantity: 50,
            is_available: true
          }
        ]
      }));
    }
  };

  const parseExcelFile = (file: File) => {
    setFileName(file.name);
    setIsProcessing(true);
    setStatusMessage('Reading spreadsheet...');

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

        // 1. Locate header row
        let headerRowIdx = -1;
        let colName = -1;
        let colPack = -1;
        let colBrand = -1;
        let colMrp = -1;
        let colSRate = -1;

        for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
          const row = rawRows[r] || [];
          for (let c = 0; c < row.length; c++) {
            const val = String(row[c] || '').trim().toLowerCase();
            if (val === 'name' || val === 'item name' || val === 'product name') colName = c;
            if (val === 'pack' || val === 'unit' || val === 'unit size') colPack = c;
            if (val === 'brand' || val === 'company') colBrand = c;
            if (val === 'mrp' || val === 'new-mrp') colMrp = c;
            if (val === 'srate' || val === 'sale rate' || val === 'price' || val === 'rate') colSRate = c;
          }
          if (colName !== -1 && (colMrp !== -1 || colSRate !== -1)) {
            headerRowIdx = r;
            break;
          }
        }

        // Fallback column positions if standard store format
        if (headerRowIdx === -1) {
          headerRowIdx = 5;
          colName = 1;
          colPack = 2;
          colBrand = 3;
          colMrp = 4;
          colSRate = 6;
        }

        setStatusMessage('Extracting products and analyzing quantity options...');

        // 2. Parse product rows
        const rawProductList: {
          baseName: string;
          fullName: string;
          unitSize: string;
          brand: string;
          mrp: number;
          price: number;
          categoryId: string;
        }[] = [];

        for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row) continue;

          const rawName = String(row[colName] || '').trim();
          const firstVal = String(row[0] || '');

          // Ignore banners / page headers
          if (
            !rawName ||
            rawName.toLowerCase() === 'name' ||
            firstVal.includes('SAI DARSHAN') ||
            firstVal.includes('Price List') ||
            firstVal.includes('Page No.')
          ) {
            continue;
          }

          const rawPack = colPack !== -1 ? String(row[colPack] || '').trim() : '';
          const rawBrand = colBrand !== -1 ? String(row[colBrand] || '').trim() : '';

          let mrp = colMrp !== -1 ? parseFloat(String(row[colMrp] || '0').replace(/[^0-9.]/g, '')) || 0 : 0;
          let srate = colSRate !== -1 ? parseFloat(String(row[colSRate] || '0').replace(/[^0-9.]/g, '')) || 0 : 0;

          // Anomaly checks
          if (srate > 10000) srate = mrp; // Fix 100-crore typo
          if (srate === 0 && mrp > 0) srate = mrp;
          if (mrp > 0 && srate > mrp) srate = mrp;
          if (mrp === 0 && srate > 0) mrp = srate;

          // Skip completely unpriced rows
          if (mrp === 0 && srate === 0) continue;

          const { baseName, unitSize } = extractBaseNameAndPack(rawName, rawPack);
          const categoryId = guessCategoryId(rawName, rawBrand);

          rawProductList.push({
            baseName,
            fullName: rawName,
            unitSize,
            brand: rawBrand,
            mrp,
            price: srate,
            categoryId
          });
        }

        setRawProducts(rawProductList);
        const finalItems = buildFinalItems(rawProductList, groupVariants);
        setParsedItems(finalItems);
        setIsProcessing(false);
        setStatusMessage(null);
      } catch (err: any) {
        console.error('Excel parse error:', err);
        alert('Failed to parse excel file: ' + (err.message || 'Unknown error'));
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

  // Bulk upload parsed products to Supabase in batches
  const handleBulkUpload = async () => {
    if (parsedItems.length === 0) return;
    if (!isSupabaseConfigured) {
      alert('Supabase is not configured yet. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to upload live data.');
      return;
    }

    setIsUploading(true);
    setProgressPercent(0);
    setStatusMessage('Preparing batch sync to database...');

    const batchSize = 100;
    const totalBatches = Math.ceil(parsedItems.length / batchSize);
    let successfulCount = 0;

    try {
      for (let b = 0; b < totalBatches; b++) {
        const start = b * batchSize;
        const end = Math.min(start + batchSize, parsedItems.length);
        const batch = parsedItems.slice(start, end);

        const payload = batch.map((item, i) => ({
          sku: item.sku || `SDM-${start + i + 1}`,
          name: item.name,
          brand: item.brand || null,
          category_id: item.category_id || categories[0]?.id || null,
          price: item.price,
          mrp: item.mrp || item.price,
          unit_size: item.pack || '1 unit',
          stock_quantity: 50,
          is_available: true,
          is_featured: false,
          is_archived: false,
          variants: item.variants || [],
          description: `${item.name} available at Sai Darshan Shopping Mart Jabalpur.`,
          updated_at: new Date().toISOString()
        }));

        const { error } = await withTimeout(
          supabase.from('products').upsert(payload, { onConflict: 'sku' }),
          10000
        );

        if (error) {
          console.warn(`Batch ${b + 1} warning:`, error.message);
        } else {
          successfulCount += batch.length;
        }

        const pct = Math.round(((b + 1) / totalBatches) * 100);
        setProgressPercent(pct);
        setStatusMessage(`Uploaded batch ${b + 1} of ${totalBatches} (${successfulCount} products saved)...`);
      }

      alert(`Successfully imported ${successfulCount} products with content quantity options!`);
      onImportComplete();
      if (onClose) onClose();
    } catch (err: any) {
      console.error('Upload error:', err);
      alert('Upload interrupted: ' + (err.message || 'Network error'));
    } finally {
      setIsUploading(false);
      setStatusMessage(null);
    }
  };

  const totalQuantityOptions = parsedItems.reduce((acc, p) => acc + (p.variants?.length || 1), 0);

  return (
    <div className="excel-import-widget">
      {/* Drag & Drop Area */}
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
          <div className="excel-dropzone__title">Drag & Drop Excel Product File Here</div>
          <div className="excel-dropzone__subtitle">
            Upload your latest supermarket price list (.xlsx, .xls). Automatic anomaly cleaning and quantity options grouping will be applied.
          </div>
          <div className="excel-dropzone__badges">
            <span className="excel-badge">EXCEL .XLSX</span>
            <span className="excel-badge">EXCEL .XLS</span>
            <span className="excel-badge">AUTO-CLEAN POS ERRORS</span>
            <span className="excel-badge">CONTENT QUANTITY GROUPING</span>
          </div>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '36px', color: 'var(--md-sys-color-primary)', marginBottom: '16px' }} className="material-symbols-outlined">
            sync
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Processing Excel Spreadsheet...</h3>
          <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '14px' }}>{statusMessage}</p>
        </div>
      )}

      {/* Preview Section */}
      {parsedItems.length > 0 && (
        <div className="excel-preview">
          <div className="excel-file-info">
            <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-primary)' }}>description</span>
            <span style={{ fontWeight: 600 }}>{fileName}</span>
            <button
              type="button"
              className="sdm-btn sdm-btn--text"
              style={{ marginLeft: 'auto', padding: '0 12px', height: '32px' }}
              onClick={() => {
                setParsedItems([]);
                setRawProducts([]);
                setFileName(null);
              }}
              disabled={isUploading}
            >
              Choose Different File
            </button>
          </div>

          <div className="excel-preview__stats">
            <div className="excel-stat-card">
              <span className="excel-stat-card__value">{parsedItems.length}</span>
              <span className="excel-stat-card__label">Total Products</span>
            </div>
            <div className="excel-stat-card">
              <span className="excel-stat-card__value">{totalQuantityOptions}</span>
              <span className="excel-stat-card__label">{groupVariants ? 'Quantity Options' : 'Individual SKUs'}</span>
            </div>
            <div className="excel-stat-card">
              <span className="excel-stat-card__value">100%</span>
              <span className="excel-stat-card__label">Cleaned & Ready</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={groupVariants}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setGroupVariants(isChecked);
                  if (rawProducts.length > 0) {
                    setParsedItems(buildFinalItems(rawProducts, isChecked));
                  }
                }}
                disabled={isUploading}
              />
              <span>Group pack variants (e.g. 50g, 100g, 250g) under common item</span>
            </label>
          </div>

          <div className="excel-preview__table-wrapper">
            <table className="excel-preview__table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Quantity Options (Variants)</th>
                  <th>MRP</th>
                  <th>Sale Price</th>
                  <th>Department</th>
                </tr>
              </thead>
              <tbody>
                {parsedItems.slice(0, 8).map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td>
                      {item.variants && item.variants.length > 1 ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'var(--md-sys-color-primary-container)',
                          color: 'var(--md-sys-color-on-primary-container)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          {item.variants.length} options ({item.variants.map(v => v.unit_size).join(', ')})
                        </span>
                      ) : (
                        item.pack || '1 unit'
                      )}
                    </td>
                    <td style={{ color: 'var(--md-sys-color-outline)' }}>₹{item.mrp}</td>
                    <td style={{ fontWeight: 600, color: 'var(--md-sys-color-primary)' }}>₹{item.price}</td>
                    <td>
                      {categories.find(c => c.id === item.category_id)?.name || 'General'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isUploading && (
            <div className="excel-progress">
              <div className="excel-progress__header">
                <span>{statusMessage}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="excel-progress__track">
                <div className="excel-progress__bar" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}

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
              className="sdm-btn sdm-btn--primary"
              onClick={handleBulkUpload}
              disabled={isUploading}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>cloud_upload</span>
              <span>{isUploading ? 'Uploading to Database...' : `Save ${parsedItems.length} Products to Store`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
