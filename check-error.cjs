const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.error('PAGE ERROR:', err.message);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('CONSOLE ERROR:', msg.text());
    }
  });
  
  try {
    await page.goto('https://urkio.com', { waitUntil: 'networkidle0', timeout: 15000 });
    console.log("Page loaded successfully.");
    const bodyText = await page.evaluate(() => document.body.innerHTML);
    if (!bodyText.trim() || bodyText.includes('<div id="root"></div>')) {
      // Check if root is actually empty, indicating React crashed without throwing a top level error
      const rootHtml = await page.evaluate(() => {
        const root = document.getElementById('root');
        return root ? root.innerHTML : 'No root found';
      });
      console.log("Root content:", rootHtml.substring(0, 200));
    }
  } catch (err) {
    console.error("Navigation error:", err);
  } finally {
    await browser.close();
  }
})();
