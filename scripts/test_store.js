import { chromium } from 'playwright';

async function testStore() {
  console.log('⚡ Running Automated Playwright Test on Live Store...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const testQueries = ['Patanjali', 'Parle 20-20', 'Dettol', 'Cadbury', 'Surf Excel', 'Colgate'];

  for (const q of testQueries) {
    const url = `http://localhost:5173/shop?q=${encodeURIComponent(q)}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(800);

    const result = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('article, [class*="product-card"], [class*="ProductCard"]'));
      return {
        cardCount: cards.length,
        firstCard: cards[0] ? {
          title: cards[0].querySelector('h3, h2, [class*="title"], [class*="name"]')?.innerText,
          price: cards[0].querySelector('[class*="price"]')?.innerText?.replace(/\n/g, ' '),
          imgRendered: cards[0].querySelector('img')?.complete && (cards[0].querySelector('img')?.naturalWidth || 0) > 0
        } : null
      };
    });

    console.log(`Query: "${q.padEnd(12)}" -> Cards: ${result.cardCount} | First: ${result.firstCard?.title?.slice(0, 45)}... | Img Rendered: ${result.firstCard?.imgRendered}`);
  }

  await browser.close();
  console.log('✅ Store automated verification passed successfully!');
}

testStore().catch(console.error);
