const { execSync } = require('child_process');
const fs = require('fs');

async function forge() {
  console.log('🏗️ [FORGE] Capacitor Build Pipeline...');
  try {
    if (!fs.existsSync('capacitor.config.json')) {
      const capConfig = { appId: "com.forge.stealth", appName: "Stealth AI App", webDir: "www" };
      fs.writeFileSync('capacitor.config.json', JSON.stringify(capConfig, null, 2));
    }

    if (!fs.existsSync('android')) {
      execSync('npx cap add android', { stdio: 'inherit' });
    }
    
    execSync('npx cap sync android', { stdio: 'inherit' });
    execSync('cd android && chmod +x gradlew && ./gradlew assembleDebug', { stdio: 'inherit' });
    console.log('🚀 [DONE] APK gereed!');
  } catch (e) {
    console.error('❌ [BUILD ERROR]', e.message);
    process.exit(1);
  }
}
forge();