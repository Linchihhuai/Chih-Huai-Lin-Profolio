import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifacts = path.join(root, 'artifacts');
await mkdir(artifacts, { recursive: true });
const port = process.env.TEST_PORT || '4180';
const origin = `http://127.0.0.1:${port}`;
const address = `${origin}/chih_huai_lin_profolio/`;
const server = spawn(process.execPath, ['scripts/serve.mjs', '--built'], {
  cwd: root, env: { ...process.env, PORT: port }, stdio: ['ignore', 'pipe', 'pipe']
});
let serverOutput = '';
server.stdout.on('data', (chunk) => { serverOutput += chunk; });
server.stderr.on('data', (chunk) => { serverOutput += chunk; });
const report = { address, startedAt: new Date().toISOString(), checks: [], layouts: [], errors: [] };
let browser;
const check = (description) => { report.checks.push(description); console.log(`PASS ${description}`); };

try {
  let available = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error(`Preview server stopped: ${serverOutput}`);
    try { if ((await fetch(address)).ok) { available = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(available, `Preview server did not start: ${serverOutput}`);
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const sizes = [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
    { name: 'small-mobile', width: 320, height: 740 }
  ];

  for (const size of sizes) {
    const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    const failedResources = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('requestfailed', (request) => failedResources.push(`${request.url()}: ${request.failure()?.errorText}`));
    page.on('response', (response) => { if (response.url().startsWith(origin) && response.status() >= 400) failedResources.push(`${response.status()} ${response.url()}`); });
    const response = await page.goto(address, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    const overflow = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      introductionPosition: getComputedStyle(document.querySelector('.introduction')).position
    }));
    assert.ok(overflow.document <= overflow.viewport + 1 && overflow.body <= overflow.viewport + 1, `${size.name} has horizontal overflow: ${JSON.stringify(overflow)}`);
    assert.equal(overflow.introductionPosition, size.width > 1000 ? 'sticky' : 'relative');
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('main section').count(), 5);
    await page.addScriptTag({ path: path.join(root, 'node_modules/axe-core/axe.min.js') });
    const accessibility = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }));
    await writeFile(path.join(artifacts, `axe-${size.name}.json`), JSON.stringify(accessibility, null, 2));
    assert.deepEqual(accessibility.violations.map((violation) => ({ id: violation.id, impact: violation.impact, nodes: violation.nodes.map((node) => node.target) })), [], `${size.name} accessibility violations`);
    if (['desktop', 'mobile'].includes(size.name)) await page.screenshot({ path: path.join(artifacts, `${size.name}.png`), fullPage: true });
    check(`${size.name} (${size.width}px): no overflow, correct layout, five sections, axe WCAG A/AA clean`);

    await page.locator('.section-nav a[href="#projects"]').click();
    await page.waitForFunction(() => document.querySelector('.section-nav a[aria-current="location"]')?.getAttribute('href') === '#projects');
    assert.equal(new URL(page.url()).hash, '#projects');
    const projectTop = await page.locator('#projects').evaluate((element) => element.getBoundingClientRect().top);
    assert.ok(projectTop >= 0 && projectTop < size.height * 0.5, `${size.name} navigation did not scroll to projects: ${projectTop}`);
    await page.locator('.section-nav a[href="#about"]').click();
    await page.waitForFunction(() => document.querySelector('.section-nav a[aria-current="location"]')?.getAttribute('href') === '#about');
    await page.locator('#experience').evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.waitForFunction(() => document.querySelector('.section-nav a[aria-current="location"]')?.getAttribute('href') === '#experience');
    assert.equal(await page.locator('.section-nav a[aria-current]').count(), 1, 'Only one section should be active');
    check(`${size.name}: anchor navigation and active-section updates work`);
    assert.deepEqual(errors, [], `${size.name} console or JavaScript errors`);
    assert.deepEqual(failedResources, [], `${size.name} missing local assets`);
    report.layouts.push({ ...size, overflow, axeViolations: accessibility.violations.length, consoleErrors: errors, failedResources });
    await context.close();
  }

  const keyboardContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const keyboard = await keyboardContext.newPage();
  await keyboard.goto(address, { waitUntil: 'networkidle' });
  await keyboard.keyboard.press('Tab');
  assert.equal(await keyboard.evaluate(() => document.activeElement?.textContent.trim()), 'Skip to content');
  assert.ok(await keyboard.locator('.skip-link').evaluate((element) => element.getBoundingClientRect().top >= 0), 'Focused skip link must be visible');
  await keyboard.keyboard.press('Enter');
  assert.equal(await keyboard.evaluate(() => document.activeElement.id), 'main-content');
  await keyboard.keyboard.press('Tab');
  const keyboardFocus = await keyboard.evaluate(() => {
    const element = document.activeElement;
    const style = getComputedStyle(element);
    return { tag: element.tagName, outline: style.outlineStyle, width: parseFloat(style.outlineWidth), visible: element.matches(':focus-visible') };
  });
  assert.equal(keyboardFocus.tag, 'A');
  assert.ok(keyboardFocus.visible && keyboardFocus.outline !== 'none' && keyboardFocus.width >= 2, `Keyboard focus should be apparent: ${JSON.stringify(keyboardFocus)}`);
  const reduced = await keyboard.evaluate(() => ({
    matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    scroll: getComputedStyle(document.documentElement).scrollBehavior,
    transition: getComputedStyle(document.querySelector('.nav-line')).transitionDuration
  }));
  assert.ok(reduced.matches);
  assert.equal(reduced.scroll, 'auto');
  assert.ok(reduced.transition.split(',').every((duration) => parseFloat(duration) === 0));
  check('Keyboard: first-tab skip link, main focus target, visible link focus, reduced-motion support');

  const assets = await keyboard.evaluate(() => [...new Set([...document.querySelectorAll('[src], link[href]')].map((element) => element.src || element.href).filter((value) => value.includes('/assets/')))]);
  assets.push(`${address}assets/social-card.png`);
  for (const asset of assets) {
    const result = await keyboard.request.get(asset);
    assert.equal(result.status(), 200, `Pages subdirectory asset missing: ${asset}`);
    assert.ok((await result.body()).length > 0);
  }
  const redirect = await keyboard.request.get(`${origin}/chih_huai_lin_profolio`, { maxRedirects: 0 });
  assert.equal(redirect.status(), 301);
  assert.equal(redirect.headers().location, '/chih_huai_lin_profolio/');
  check(`Pages subdirectory: ${assets.length} assets respond 200 and base URL redirects correctly`);
  await keyboardContext.close();

  const noJSContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJS = await noJSContext.newPage();
  await noJS.goto(address, { waitUntil: 'networkidle' });
  assert.equal(await noJS.locator('h1').innerText(), 'Chih-Huai Lin');
  assert.ok((await noJS.locator('#about').innerText()).includes('Institut Paul Lambin'));
  assert.equal(await noJS.locator('main section').count(), 5);
  await noJS.locator('.section-nav a[href="#projects"]').click();
  assert.equal(new URL(noJS.url()).hash, '#projects');
  // Poll from Node: page-side polling is intentionally disabled with JavaScript.
  // Native CSS smooth scrolling still needs time to finish.
  let noJSTop;
  for (let attempt = 0; attempt < 20; attempt++) {
    noJSTop = await noJS.locator('#projects').evaluate((element) => element.getBoundingClientRect().top);
    if (noJSTop >= 0 && noJSTop < 844) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(noJSTop >= 0 && noJSTop < 844, 'Native navigation must work without JavaScript');
  check('JavaScript disabled: identity, content, all five categories, and native anchor navigation work');
  await noJSContext.close();
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.errors.push(error.stack || String(error));
  console.error(error);
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  await writeFile(path.join(artifacts, 'validation.json'), JSON.stringify(report, null, 2));
  await browser?.close();
  server.kill('SIGTERM');
}
