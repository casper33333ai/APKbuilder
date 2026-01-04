const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

async function injectSession(page, cookieData) {
  try {
    if (!cookieData || cookieData === '[]' || cookieData === '') {
      console.log('ℹ️ [SESSION] Geen sessie-cookies gevonden.');
      return;
    }
    let cookies = JSON.parse(cookieData);
    const validCookies = cookies.map(c => ({
      name: c.name,
      value: c.value,
      domain: c.domain || '.google.com',
      path: c.path || '/',
      secure: true,
      httpOnly: c.httpOnly || false,
      sameSite: 'Lax'
    }));
    await page.setCookie(...validCookies);
    console.log('✅ [SESSION] Cookies geïnjecteerd.');
  } catch (err) {
    console.error('⚠️ [SESSION] Fout:', err.message);
  }
}

async function scrapeAIStudio() {
  const url = process.env.AI_URL || "https://ai.studio/apps/drive/1C95LlT34ylBJSzh30JU2J1ZlwMZSIQrx";
  const rawCookies = process.env.SESSION_COOKIES || '[]';
  
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await injectSession(page, rawCookies);

    console.log('🌐 [NAVIGATE] Laden: ' + url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wacht op AI Studio specifieke rendering
    await new Promise(r => setTimeout(r, 20000));

    const content = await page.evaluate(() => {
      const getDeepContent = () => {
        const root = document.querySelector('app-root') || document.body;
        const iframe = document.querySelector('iframe');
        if (iframe) {
          try { return iframe.contentDocument.body.innerHTML; } catch(e) {}
        }
        return root.innerHTML;
      };
      return getDeepContent();
    });

    const finalHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Stealth AI App</title><style>body{margin:0;font-family:sans-serif}</style></head><body>${content}</body></html>`;

    if (!fs.existsSync('www')) fs.mkdirSync('www', { recursive: true });
    fs.writeFileSync(path.join('www', 'index.html'), finalHtml);
    console.log('✅ [SUCCESS] HTML gegenereerd.');
  } catch (err) {
    console.error('❌ [ERROR]', err.message);
    if (!fs.existsSync('www')) fs.mkdirSync('www', { recursive: true });
    fs.writeFileSync(path.join('www', 'index.html'), '<html><body><h1>Build Failed</h1><p>' + err.message + '</p></body></html>');
  } finally {
    await browser.close();
  }
}
scrapeAIStudio();