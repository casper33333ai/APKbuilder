const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

async function quantumScrape() {
  const url = process.env.AI_URL || "https://aistudio.google.com/u/1/apps/drive/1C95LlT34ylBJSzh30JU2J1ZlwMZSIQrx?showPreview=true&showAssistant=true";
  const rawCookies = process.env.SESSION_COOKIES || '[]';
  const userDataDir = path.join(process.cwd(), '.chrome-session');
  
  console.log('🛡️ [V14-QUANTUM] Initializing Ultra-Stealth Engine...');
  
  const browser = await puppeteer.launch({ 
    headless: "new",
    executablePath: '/usr/bin/google-chrome',
    userDataDir: userDataDir,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
      '--disable-dev-shm-usage', 
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // Stealth evasion: Webdriver removal
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    if (rawCookies && rawCookies.length > 20) {
      console.log('🍪 [AUTH] Injecting Encrypted Session Vault...');
      const cookies = JSON.parse(rawCookies);
      await page.setCookie(...cookies.map(c => ({
        ...c, 
        domain: c.domain || '.google.com',
        secure: true,
        httpOnly: c.httpOnly || false,
        sameSite: 'Lax'
      })));
    }

    console.log('🌐 [CONNECT] Tunnelling to: ' + url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 150000 });
    
    // Failsafe: Wait for specific AI Studio markers
    console.log('⏳ [HYDRATE] Waiting for DOM Stability...');
    try {
      await page.waitForSelector('app-root', { timeout: 60000 });
    } catch (e) {
      console.log('⚠️ Marker "app-root" not found, falling back to body wait.');
    }

    // Capture hydration state
    const bundleData = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src).filter(s => s);
      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href);
      return {
        html: document.body.innerHTML,
        head: document.head.innerHTML,
        origin: window.location.origin,
        cookies: document.cookie
      };
    });

    const finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <base href="${bundleData.origin}/">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
  <title>Quantum AI Native</title>
  ${bundleData.head}
  <script>
    // Hardcoded Cookie Bridge for SPA Consistency
    (function() {
      const cookies = ${JSON.stringify(bundleData.cookies)};
      if (cookies) {
        cookies.split(';').forEach(c => {
          document.cookie = c.trim() + "; domain=.google.com; path=/; SameSite=Lax";
        });
      }
      console.log("💎 [FORGE] Session Bridge Active");
    })();
  </script>
  <style>
    body { background: #000 !important; color: #fff !important; margin: 0; padding: 0; }
    #forge-container { width: 100vw; height: 100vh; overflow: auto; -webkit-overflow-scrolling: touch; }
  </style>
</head>
<body class="v14-quantum">
  <div id="forge-container">${bundleData.html}</div>
</body>
</html>`;

    if (!fs.existsSync('www')) fs.mkdirSync('www', { recursive: true });
    fs.writeFileSync(path.join('www', 'index.html'), finalHtml);
    console.log('✅ [MANIFEST] Interface captured. Session directory preserved.');
  } catch (err) {
    console.error('❌ [FATAL] Extraction halted:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}
quantumScrape();