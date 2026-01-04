const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function initiateQuantumForge() {
  console.log('🏗️ [V14-BUILDER] Patching Android Native Source...');
  
  const exec = (cmd) => execSync(cmd, { stdio: 'inherit' });

  try {
    // 1. Sync Native Project
    if (!fs.existsSync('android')) exec('npx cap add android');
    exec('npx cap sync android');

    // 2. Patch AndroidManifest.xml for Cleartext and Hardware Accel
    const manifestPath = 'android/app/src/main/AndroidManifest.xml';
    let manifest = fs.readFileSync(manifestPath, 'utf8');
    if (!manifest.includes('android:usesCleartextTraffic="true"')) {
      manifest = manifest.replace('<application', '<application android:usesCleartextTraffic="true"');
      fs.writeFileSync(manifestPath, manifest);
      console.log('🛡️ [PATCH] Manifest updated: Cleartext Traffic enabled.');
    }

    // 3. Deep-Patch Bridge Settings (MainActivity.java)
    // We inject native CookieManager settings to bypass login screens
    const javaPath = 'android/app/src/main/java/com/forge/quantum/v14/MainActivity.java';
    if (fs.existsSync(javaPath)) {
      let javaCode = fs.readFileSync(javaPath, 'utf8');
      if (!javaCode.includes('CookieManager')) {
        const importPatch = 'import android.webkit.CookieManager;\nimport android.webkit.WebSettings;\nimport com.getcapacitor.BridgeActivity;';
        javaCode = javaCode.replace('import com.getcapacitor.BridgeActivity;', importPatch);
        
        const initPatch = `
    @Override
    public void onResume() {
        super.onResume();
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(this.bridge.getWebView(), true);
        WebSettings settings = this.bridge.getWebView().getSettings();
        settings.setDomStorageEnabled(true);
        settings.setJavaScriptEnabled(true);
        settings.setUserAgentString("Mozilla/5.0 (Linux; Android 10; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36");
    }
`;
        javaCode = javaCode.replace('public class MainActivity extends BridgeActivity {}', 'public class MainActivity extends BridgeActivity {' + initPatch + '}');
        fs.writeFileSync(javaPath, javaCode);
        console.log('💎 [PATCH] Native WebView logic hard-injected.');
      }
    }

    // 4. Force Gradle Build
    if (process.platform !== 'win32') exec('chmod -R 777 android');
    
    console.log('🚀 [GRADLE] Compiling V14 Optimized Binary...');
    const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    exec('cd android && ' + gradlew + ' assembleDebug --no-daemon');
    
    console.log('✨ [SUCCESS] Quantum Forge Complete.');
  } catch (e) {
    console.error('❌ [ERROR] Build failure:', e.message);
    process.exit(1);
  }
}
initiateQuantumForge();