import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });

    await page.type('input[type="email"]', 'hr@apptrait.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.goto('http://localhost:5173/attendance', { waitUntil: 'networkidle0' });

    await page.screenshot({
      path: 'C:/Users/shrey/.gemini/antigravity/brain/117dec5a-ded1-4ba4-bb82-c50d87540027/attendance_month_picker_verified.png',
      fullPage: true,
    });

    console.log('Screenshot captured successfully!');
    await browser.close();
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  }
})();
