const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

async function run() {
  const excelPath = path.resolve('main_data/ALL PRODUCT LIST.xlsx');
  if (fs.existsSync(excelPath)) {
    const wb = XLSX.readFile(excelPath);
    console.log('Sheets in ALL PRODUCT LIST.xlsx:', wb.SheetNames);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log('Total rows in Excel:', rows.length);
    console.log('\nHeader / Top rows:');
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      console.log('Row ' + (i + 1) + ':', JSON.stringify(rows[i]));
    }

    // Inspect columns
    // Count rows with curated YES vs all
    let curatedCount = 0;
    let curatedWithImg = 0;
    for (let i = 6; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[1]) continue;
      if (r[7] === 'YES') {
        curatedCount++;
        if (r[8] && String(r[8]).startsWith('http')) curatedWithImg++;
      }
    }
    console.log('\nExcel curated count (Col H == YES):', curatedCount);
    console.log('Excel curated with image (Col I):', curatedWithImg);
  } else {
    console.log('Excel file not found at:', excelPath);
  }
}

run().catch(console.error);
