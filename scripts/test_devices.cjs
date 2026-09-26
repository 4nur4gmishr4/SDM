const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'test-results', 'device-screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Device configs matching User specifications
const DEVICES = [
  {
    name: 'iphone-14-pro',
    label: 'Apple iPhone 14 Pro (Mobile iOS)',
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
  },
  {
    name: 'pixel-7',
    label: 'Google Pixel 7 (Mobile Android)',
    viewport: { width: 412, height: 915 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
  },
  {
    name: 'ipad-air',
    label: 'Apple iPad Air (Tablet)',
    viewport: { width: 820, height: 1180 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
  },
  {
    name: 'desktop-laptop-windows',
    label: 'Windows Laptop (1440x900)',
    viewport: { width: 1440, height: 900 },
    isMobile: false,
    hasTouch: false,
  },
  {
    name: 'desktop-macos-fullhd',
    label: 'macOS / Linux Full HD (1920x1080)',
    viewport: { width: 1920, height: 1080 },
    isMobile: false,
    hasTouch: false,
  },
];

const PAGES_TO_TEST = [
  { route: '/', name: 'home-page' },
  { route: '/about', name: 'about-store-page' },
  { route: '/shop', name: 'shop-catalog-page' },
  { route: '/quick-order', name: 'quick-order-page' },
  { route: '/cart', name: 'cart-page' },
  { route: '/checkout', name: 'checkout-page' },
  { route: '/non-existent-route', name: 'not-found-page' },
];

async function runDeviceTests() {
  console.log('Starting Playwright multi-device test suite...');
  console.log(`Targeting dev server: ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const report = {
    timestamp: new Date().toISOString(),
    testedDevices: [],
    themeConsistencyChecks: [],
    errors: [],
    allPassed: true,
  };

  // First: Test Theme Consistency (Auto Dark vs Explicit Dark vs Light)
  console.log('\n========================================');
  console.log('Testing Theme Consistency: Auto Dark vs Explicit Dark vs Light');
  console.log('========================================');

  const themeContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    colorScheme: 'dark', // System prefers dark
  });
  const themePage = await themeContext.newPage();

  // Test 1: System theme with dark OS
  await themePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await themePage.waitForTimeout(500);

  const autoThemeAttr = await themePage.evaluate(() => {
    return {
      dataTheme: document.documentElement.getAttribute('data-theme'),
      bgSurface: window.getComputedStyle(document.body).backgroundColor,
      cardBg: window.getComputedStyle(document.querySelector('.ios-banner-card')).backgroundColor,
    };
  });
  console.log(`Auto Theme (Dark OS): data-theme="${autoThemeAttr.dataTheme}", bg=${autoThemeAttr.bgSurface}`);

  // Test 2: Switch explicitly to dark
  await themePage.evaluate(() => {
    localStorage.setItem('sdm-theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await themePage.reload({ waitUntil: 'networkidle' });
  await themePage.waitForTimeout(400);

  const explicitDarkAttr = await themePage.evaluate(() => {
    return {
      dataTheme: document.documentElement.getAttribute('data-theme'),
      bgSurface: window.getComputedStyle(document.body).backgroundColor,
      cardBg: window.getComputedStyle(document.querySelector('.ios-banner-card')).backgroundColor,
    };
  });
  console.log(`Explicit Dark Theme: data-theme="${explicitDarkAttr.dataTheme}", bg=${explicitDarkAttr.bgSurface}`);

  const themesMatch =
    autoThemeAttr.dataTheme === explicitDarkAttr.dataTheme &&
    autoThemeAttr.bgSurface === explicitDarkAttr.bgSurface &&
    autoThemeAttr.cardBg === explicitDarkAttr.cardBg;

  console.log(`Theme Consistency Check: ${themesMatch ? '100% IDENTICAL ✅' : 'MISMATCH ❌'}`);
  report.themeConsistencyChecks.push({
    autoTheme: autoThemeAttr,
    explicitDark: explicitDarkAttr,
    match: themesMatch,
  });

  // Reset to default
  await themePage.evaluate(() => localStorage.removeItem('sdm-theme'));
  await themeContext.close();

  // Next: Multi-device test loop
  for (const device of DEVICES) {
    console.log(`\n========================================`);
    console.log(`Testing Device: ${device.label} (${device.viewport.width}x${device.viewport.height})`);
    console.log(`========================================`);

    const context = await browser.newContext({
      viewport: device.viewport,
      isMobile: device.isMobile,
      hasTouch: device.hasTouch,
      userAgent: device.userAgent,
    });

    const page = await context.newPage();
    const deviceResults = {
      device: device.name,
      label: device.label,
      viewport: device.viewport,
      pageTests: [],
    };

    for (const pageItem of PAGES_TO_TEST) {
      const url = `${BASE_URL}${pageItem.route}`;
      process.stdout.write(`  -> Testing ${pageItem.name} (${pageItem.route})... `);

      try {
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(500);

        // Verify No Horizontal Scroll / Overflow Bug
        const overflowCheck = await page.evaluate(() => {
          const scrollW = document.documentElement.scrollWidth;
          const innerW = window.innerWidth;
          return {
            scrollWidth: scrollW,
            innerWidth: innerW,
            hasOverflow: scrollW > innerW + 1,
          };
        });

        // Screenshot
        const screenshotPath = path.join(
          SCREENSHOTS_DIR,
          `${device.name}_${pageItem.name}.png`
        );
        await page.screenshot({ path: screenshotPath, fullPage: false });

        const result = {
          route: pageItem.route,
          name: pageItem.name,
          status: response ? response.status() : 'OK',
          hasOverflow: overflowCheck.hasOverflow,
          scrollWidth: overflowCheck.scrollWidth,
          innerWidth: overflowCheck.innerWidth,
          passed: !overflowCheck.hasOverflow,
        };

        if (overflowCheck.hasOverflow) {
          console.log(`❌ OVERFLOW (${overflowCheck.scrollWidth}px > ${overflowCheck.innerWidth}px)`);
          report.allPassed = false;
        } else {
          console.log(`✅ OK (No overflow)`);
        }

        deviceResults.pageTests.push(result);
      } catch (err) {
        console.log(`❌ Error: ${err.message}`);
        deviceResults.pageTests.push({
          route: pageItem.route,
          name: pageItem.name,
          error: err.message,
          passed: false,
        });
        report.allPassed = false;
      }
    }

    // Special verification on /: Banner Structure & Instagram Story Loader
    console.log(`  -> Testing Home Page Banner: Merged Vignette Section & Story Loader...`);
    try {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);

      // Check that image viewport exists and does NOT contain the title text overlay
      const hasCleanMediaViewport = await page.locator('.ios-banner__media-viewport').isVisible();
      const hasMergedSection = await page.locator('.ios-banner__merged-section').isVisible();
      const hasStoryLoaderBar = await page.locator('.ios-banner__insta-loader-bar').isVisible();

      console.log(`     Clean image viewport: ${hasCleanMediaViewport ? '✅' : '❌'}`);
      console.log(`     Merged bottom vignette section: ${hasMergedSection ? '✅' : '❌'}`);
      console.log(`     Instagram story progress bar: ${hasStoryLoaderBar ? '✅' : '❌'}`);

      // Verify loader progress moves
      const p1 = await page.locator('.ios-banner__progress-bar').first().evaluate((el) => el.style.width);
      await page.waitForTimeout(400);
      const p2 = await page.locator('.ios-banner__progress-bar').first().evaluate((el) => el.style.width);
      console.log(`     Instagram story loader advancing (${p1} -> ${p2}): ${p1 !== p2 ? '✅' : '⚠️'}`);
    } catch (bannerErr) {
      console.log(`     ❌ Banner test error: ${bannerErr.message}`);
    }

    // Special verification on /about: Streamlined 1000x1000 Grid & Tap-to-view Lightbox
    console.log(`  -> Testing About Page: Streamlined 1000x1000 Grid & Tap-to-View Lightbox...`);
    try {
      await page.goto(`${BASE_URL}/about`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      const cardsCount = await page.locator('.about-curated-card').count();
      console.log(`     Curated department cards count: ${cardsCount} (Target: 6)`);

      // Click first card to open lightbox
      const firstCard = page.locator('.about-curated-card').first();
      await firstCard.click();
      await page.waitForTimeout(400);

      const lightbox = page.locator('.sdm-lightbox');
      const isLightboxOpen = await lightbox.isVisible();
      console.log(`     Tap-to-view lightbox open: ${isLightboxOpen ? '✅' : '❌'}`);

      if (isLightboxOpen) {
        // Screenshot of open lightbox
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, `${device.name}_lightbox_open.png`),
        });

        // Close lightbox
        const closeBtn = page.locator('.sdm-lightbox__btn--close');
        await closeBtn.click();
        await page.waitForTimeout(300);
        console.log(`     Lightbox close on button click: ${!(await lightbox.isVisible()) ? '✅' : '❌'}`);
      }
    } catch (aboutErr) {
      console.log(`     ❌ About page test error: ${aboutErr.message}`);
    }

    await context.close();
    report.testedDevices.push(deviceResults);
  }

  await browser.close();

  // Save report
  const reportPath = path.join(__dirname, '..', 'test-results', 'playwright-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n========================================');
  console.log(`All Device Tests Completed!`);
  console.log(`Theme Match: ${report.themeConsistencyChecks[0]?.match ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`Overall Status: ${report.allPassed ? 'ALL PASSED ✅' : 'SOME CHECKS FAILED ⚠️'}`);
  console.log(`Screenshots saved to: ${SCREENSHOTS_DIR}`);
  console.log(`Report saved to: ${reportPath}`);
  console.log('========================================\n');
}

runDeviceTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
