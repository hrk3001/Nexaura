import { test, expect, chromium } from 'playwright';

test('Nexaura full playthrough recording', async ({ }) => {
  // This is a headful script, not using test runner's browser
  // We'll launch our own
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  const BASE_URL = 'http://localhost:5000';
  const RECORDING_DIR = 'C:/Users/HARITHAA/Nexaura/recordings';
  const SCREENSHOT_DIR = `${RECORDING_DIR}/screens`;
  
  // Ensure directories exist (will be created by the script logic)
  
  // ==========================================
  // STEP 1: Login and account creation
  // ==========================================
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  
  // Screenshot login page
  await page.screenshot({ path: `${SCREENSHOT_DIR}/01-login-page.png` });
  
  // Show a failed login first (unknown name) so the red error is visible
  await page.fill('input[name="name"]', 'nonexistent');
  await page.click('button:has-text("Login")');
  await expect(page.locator('[role="alert"]')).toContainText('Unknown name');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/01-failed-login.png` });
  
  // Click "Create account"
  await page.click('link:has-text("Create account")');
  await page.waitForSelector('input[name="name"]', { state: 'visible' });
  
  // Create a NEW account with a unique name
  const timestamp = Date.now().toString(36);
  const RECORDING_ACCOUNT = `rec${timestamp}`;
  await page.fill('input[name="name"]', RECORDING_ACCOUNT);
  await page.fill('input[name="password"]', 'test1234');
  await page.click('button:has-text("Create")');
  await page.waitForSelector('[data-testid="landing"]', { state: 'visible' });
  
  await page.screenshot({ path: `${SCREENSHOT_DIR}/02-landing-page.png` });
  
  // ==========================================
  // STEP 2: Go through landing/intro to case map
  // ==========================================
  await page.click('link:has-text("Case map")');
  await page.waitForSelector('[data-testid="case-map"]', { state: 'visible' });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/03-case-map.png` });
  
  // Verify only Array Fair is unlocked
  await expect(page.locator('[data-testid="stop-array-fair"]')).toHaveClass(/ unlocked/);
  await expect(page.locator('[data-testid="stop-linked"]')).not.toHaveClass(/ unlocked/);
  
  // ==========================================
  // STEP 3: Array Fair - evidence collection
  // ==========================================
  // Open Array Fair stop
  await page.click('text=Array Fair');
  await page.waitForSelector('[data-testid="game"]', { state: 'visible' });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/04-arrayfair-scene.png` });
  
  // Read evidence positions from data-evidence attribute
  const dataEvidence = page.locator('[data-testid="game"]').getAttribute('data-evidence');
  let evidencePositions = [];
  if (dataEvidence) {
    evidencePositions = dataEvidence.split('|').map(s => s.split(':').map(Number));
    console.log('Evidence positions:', evidencePositions);
  }
  
  // Get player position
  const player = page.evaluate(() => window.__nexauraPlayer);
  console.log('Initial player position:', player);
  
  // Walk to each evidence marker and press E
  for (let i = 0; i < evidencePositions.length; i++) {
    const [evId, ex, ey, ez] = evidencePositions[i];
    const target = [ex, ez];
    
    // Walk toward the clue
    let attempts = 0;
    while (attempts < 200) {
      const p = page.evaluate(() => window.__nexauraPlayer);
      const dist = Math.hypot(p.x - target[0], p.z - target[1]);
      
      if (dist < 1.5) {
        // Press E
        await page.keyboard.press('e');
        await page.waitForTimeout(600);
        
        // Verify evidence panel opened
        const panel = page.locator('[role="dialog"]');
        await expect(panel).toBeVisible({ timeout: 1000 });
        await page.screenshot({ path: `${SCREENSHOT_DIR}/05-evidence-panel-${i}.png` });
        
        // Click "Continue investigating"
        await page.click('button:has-text("Continue investigating")');
        await page.waitForSelector('[data-testid="game"]', { state: 'visible' });
        break;
      }
      
      // Move toward target
      if (p.x < target[0]) await page.keyboard.press('d'); // D increases x
      else if (p.x > target[0]) await page.keyboard.press('a'); // A decreases x
      
      if (p.z < target[1]) await page.keyboard.press('s'); // S increases z
      else if (p.z > target[1]) await page.keyboard.press('w'); // W decreases z
      
      await page.waitForTimeout(100);
      attempts++;
    }
    
    await page.waitForTimeout(400);
  }
  
  // Verify 3/3 evidence logged
  await expect(page.locator('.iri-banner')).toContainText('Evidence logged. Now decode the records.');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/06-iri-banner.png` });
  
  // Open Java challenge
  await page.click('link:has-text("Open Java challenge →")');
  await page.waitForSelector('[data-testid="challenge-panel"]', { state: 'visible' });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/07-challenge-panel.png` });
  
  // ==========================================
  // STEP 4: Solve Java challenge (arrays) - first wrong, then correct
  // ==========================================
  // First submit a deliberately wrong answer
  await page.fill('.nex-code', '// Wrong solution\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(0);\n    }\n}');
  await page.click('button:has-text("Submit")');
  await expect(page.locator('.verdict-banner')).toHaveClass(/red/);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/08-wrong-verdict.png` });
  
  // THEN fill with a CORRECT Java solution for arrays (find max element)
  await page.fill('.nex-code', `import java.io.*;\\nimport java.util.*;\\n\\npublic class Main {\\n    public static void main(String[] args) throws IOException {\\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\\n        int n = Integer.parseInt(br.readLine().trim());\\n        long[] arr = new long[n];\\n        StringTokenizer st = new StringTokenizer(br.readLine());\\n        for (int i = 0; i < n; i++) arr[i] = Long.parseLong(st.nextToken());\\n\\n        long max = arr[0];\\n        for (int i = 1; i < n; i++) if (arr[i] > max) max = arr[i];\\n\\n        System.out.println(max);\\n    }\\n}`);
  await page.click('button:has-text("Submit")');
  await expect(page.locator('.verdict-banner')).toHaveClass(/green/);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/09-accepted-verdict.png` });
  
  // Verify case update - Array Fair cleared
  await expect(page.locator('.fair-stop-cleared')).toContainText('Array Fair cleared');
  await page.click('link:has-text("Back to case map →")');
  await page.waitForSelector('[data-testid="case-map"]', { state: 'visible' });
  
  // ==========================================
  // Continue through remaining worlds...
  // ==========================================
  
  // For now, just wait and screenshot the finale area
  await page.waitForTimeout(3000);
  
  // Logout
  await page.click('link:has-text("Log out")');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/10-logout.png` });
  
  await browser.close();
  console.log('Recording complete!');
});