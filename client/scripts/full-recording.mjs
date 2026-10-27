import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const BASE_URL = 'http://localhost:5000';
  const RECORDING_DIR = 'C:/Users/HARITHAA/Nexaura/recordings';
  const SCREENSHOT_DIR = RECORDING_DIR + '/screens';

  // Ensure directories exist
  const fs = await import('fs');
  await fs.promises.mkdir(SCREENSHOT_DIR, { recursive: true });

  // Helper: wait for an element to be visible
  const waitForVisible = async (selector, timeout = 10000) => {
    const locator = page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout });
  };

  // Helper: wait for an element to contain specific text
  const waitForText = async (selector, text, timeout = 10000) => {
    const locator = page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    const textContent = await locator.innerText();
    if (textContent.includes(text)) return;
    throw new Error(`Expected text "${text}" not found in "${textContent}"`);
  };

  // ==========================================
  // STEP 1: Login / Register new account
  // ==========================================
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await waitForVisible('input[data-testid="login-name"]');
  await page.screenshot({ path: SCREENSHOT_DIR + '/01-login-page.png' });

  // Switch to register mode by clicking the register tab
  await page.click('button[data-testid="tab-register"]');
  await page.waitForTimeout(500);

  // Confirm password field should now be visible
  await waitForVisible('input[data-testid="login-confirm"]');

  // Create a NEW account with a unique name
  const timestamp = Date.now().toString(36);
  const RECORDING_ACCOUNT = 'rec' + timestamp;
  await page.fill('input[data-testid="login-name"]', RECORDING_ACCOUNT);
  await page.fill('input[data-testid="login-password"]', 'test1234');
  await page.fill('input[data-testid="login-confirm"]', 'test1234');
  await page.click('button[data-testid="login-submit"]');
  await waitForVisible('[data-testid="landing"]');

  await page.screenshot({ path: SCREENSHOT_DIR + '/02-landing-page.png' });

  // ==========================================
  // STEP 2: Go through landing/intro to case map
  // ==========================================
  // Click ENTER THE INVESTIGATION on landing
  await page.click('button:has-text("ENTER THE INVESTIGATION")');
  await waitForVisible('[data-testid="intro"]');
  await page.screenshot({ path: SCREENSHOT_DIR + '/03-intro-page.png' });

  // Swipe through intro slides - click Next until the last slide
  // The last slide has "Open the case map" button
  for (let i = 0; i < 3; i++) {
    await page.click('button:has-text("Next →")');
    await page.waitForTimeout(500);
  }

  // Now on last slide - click "Open the case map →"
  await page.click('button:has-text("Open the case map →")');
  await waitForVisible('[data-testid="map"]');
  await page.screenshot({ path: SCREENSHOT_DIR + '/04-case-map.png' });

  // Verify worlds are displayed - click Array Fair world card
  // The world cards are buttons with nex-map-card class
  await page.click('[class*="nex-map-card"]:has-text("Array Fair")');
  await waitForVisible('[data-testid="game"]');
  
  // Wait for player position to be set using waitForFunction
  await page.waitForFunction(() => window.__nexauraPlayer !== undefined, { timeout: 10000 });
  
  await page.screenshot({ path: SCREENSHOT_DIR + '/05-arrayfair-scene.png' });

  // ==========================================
  // STEP 3: Array Fair - evidence collection
  // ==========================================
  // Read evidence positions from data-evidence attribute
  const dataEvidence = await page.locator('[data-testid="game"]').evaluate((el) => el.getAttribute('data-evidence'));
  let evidencePositions = [];
  if (dataEvidence) {
    // Format: "array-signin:0.2,0.12,4|array-terminal:3.2,0.3,1|array-page:1,0.6,2"
    // Parse each evidence entry: id:x,y,z - we need [x, z]
    evidencePositions = dataEvidence.split('|').map(entry => {
      const colonIdx = entry.indexOf(':');
      if (colonIdx === -1) return null;
      const coords = entry.substring(colonIdx + 1).split(',').map(Number);
      // Return [x, z] - indices 0 and 2
      return [coords[0], coords[2]];
    }).filter(p => p && p[0] !== null && p[1] !== null);
    console.log('Evidence positions (x,z):', evidencePositions);
  }

  // Get player position
  const player = page.evaluate(() => window.__nexauraPlayer);
  console.log('Initial player position:', player);
  const [px, pz] = [player.x, player.z];
  console.log('Player x,z:', px, pz);

  // Walk to each evidence marker and press E
  for (let i = 0; i < evidencePositions.length; i++) {
    const [sx, sz] = evidencePositions[i];
    const target = [sx, sz];

    // Walk toward the clue
    let attempts = 0;
    while (attempts < 200) {
      // Wait a moment for player position to update
      await page.waitForTimeout(20);
      const p = page.evaluate(() => window.__nexauraPlayer);
      const dist = Math.hypot(p.x - target[0], p.z - target[1]);

      if (dist < 1.5) {
        // Press E
        await page.keyboard.press('e');
        await page.waitForTimeout(600);

        // Verify evidence panel opened
        await waitForVisible('[role="dialog"]');
        await page.screenshot({ path: SCREENSHOT_DIR + '/05-evidence-panel-' + i + '.png' });

        // Click "Continue investigating"
        await page.click('button:has-text("Continue investigating")');
        await waitForVisible('[data-testid="game"]');
        break;
      }

      // Move toward target
      if (p.x < target[0]) await page.keyboard.press('d'); // D increases x
      else if (p.x > target[0]) await page.keyboard.press('a'); // A decreases x

      if (p.z < target[1]) await page.keyboard.press('s'); // S increases z
      else if (p.z > target[1]) await page.keyboard.press('w'); // W decreases z

      await page.waitForTimeout(50);
      attempts++;
    }

    await page.waitForTimeout(400);
  }

  // Verify 3/3 evidence logged
  await waitForText('.iri-banner', 'Evidence logged. Now decode the records.');
  await page.screenshot({ path: SCREENSHOT_DIR + '/06-iri-banner.png' });

  // Open Java challenge
  await page.click('link:has-text("Open Java challenge →")');
  await waitForVisible('[data-testid="challenge-panel"]');
  await page.screenshot({ path: SCREENSHOT_DIR + '/07-challenge-panel.png' });

  // ==========================================
  // STEP 4: Solve Java challenge (arrays) - first wrong, then correct
  // ==========================================
  // First submit a deliberately wrong answer
  await page.fill('.nex-code', '// Wrong solution\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(0);\n    }\n}');
  await page.click('button:has-text("Submit")');
  await waitForText('.verdict-banner', 'red');
  await page.screenshot({ path: SCREENSHOT_DIR + '/08-wrong-verdict.png' });

  // THEN fill with a CORRECT Java solution for arrays (find max element)
  await page.fill('.nex-code', `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        long[] arr = new long[n];
        StringTokenizer st = new StringTokenizer(br.readLine());
        for (int i = 0; i < n; i++) arr[i] = Long.parseLong(st.nextToken());

        long max = arr[0];
        for (int i = 1; i < n; i++) if (arr[i] > max) max = arr[i];

        System.out.println(max);
    }
}`);
  await page.click('button:has-text("Submit")');
  await waitForText('.verdict-banner', 'green');
  await page.screenshot({ path: SCREENSHOT_DIR + '/09-accepted-verdict.png' });

  // Verify case update - Array Fair cleared
  await waitForText('.fair-stop-cleared', 'Array Fair cleared');
  await page.click('link:has-text("Back to case map →")');
  await waitForVisible('[data-testid="case-map"]');

  // For now, just wait and screenshot the finale area
  await page.waitForTimeout(3000);

  // Logout
  await page.click('link:has-text("Log out")');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: SCREENSHOT_DIR + '/10-logout.png' });

  await browser.close();
  console.log('Recording complete!');
})();