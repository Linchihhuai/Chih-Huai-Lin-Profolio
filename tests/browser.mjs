import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import data from '../content/portfolio.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifacts = path.join(root, 'artifacts');
await mkdir(artifacts, { recursive: true });
const port = process.env.TEST_PORT || '4180';
const origin = `http://127.0.0.1:${port}`;
const base = new URL(data.siteUrl).pathname.replace(/\/+$/, '');
assert.equal(`${base}/`, '/Chih-Huai-Lin-Profolio/', 'Preview must exercise the exact public repository name and case');
const address = `${origin}${base}/`;
const server = spawn(process.execPath, ['scripts/serve.mjs', '--built'], {
  cwd: root, env: { ...process.env, PORT: port }, stdio: ['ignore', 'pipe', 'pipe']
});
let serverOutput = '';
server.stdout.on('data', (chunk) => { serverOutput += chunk; });
server.stderr.on('data', (chunk) => { serverOutput += chunk; });
const report = { address, startedAt: new Date().toISOString(), checks: [], layouts: [], errors: [] };
let browser;
const check = (description) => { report.checks.push(description); console.log(`PASS ${description}`); };
const skillKeys = ['professional', 'academic', 'learning'];
const assertSelectedSkill = async (page, key) => {
  assert.equal(await page.locator(`[data-skill-tab="${key}"]`).getAttribute('aria-selected'), 'true');
  assert.equal(await page.locator(`[data-skill-tab="${key}"]`).getAttribute('tabindex'), '0');
  assert.equal(await page.locator(`[data-skill-select="${key}"]`).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('[data-skill-tab][aria-selected="true"]').count(), 1);
  assert.equal(await page.locator('[data-skill-tab][tabindex="0"]').count(), 1);
  assert.equal(await page.locator('[data-skill-select][aria-pressed="true"]').count(), 1);
  assert.equal(await page.locator('[data-skill-panel]:not([hidden])').count(), 1);
  const panel = page.locator(`[data-skill-panel="${key}"]`);
  assert.ok(await panel.isVisible(), `${key} skill panel should be visible`);
  const group = data.skills[skillKeys.indexOf(key)];
  for (const item of group.items) assert.ok((await panel.innerText()).includes(item), `Missing confirmed ${key} skill: ${item}`);
};
const orbitStates = async (page) => page.locator('.planet-track').evaluateAll((tracks) => tracks.map((track) => ({
  name: getComputedStyle(track).animationName,
  animations: track.getAnimations().map((animation) => ({ state: animation.playState, time: animation.currentTime }))
})));
const planetPositions = async (page) => page.locator('.skill-planet').evaluateAll((planets) => planets.map((planet) => {
  const box = planet.getBoundingClientRect();
  const map = planet.closest('.skill-map').getBoundingClientRect();
  // Measure orbital movement inside the map, independently of page scrolling
  // or the explorer's entrance transition.
  return { x: box.x - map.x, y: box.y - map.y, name: getComputedStyle(planet).animationName, states: planet.getAnimations().map((animation) => animation.playState) };
}));
const waitForOrbitState = async (page, state) => page.waitForFunction((expected) => {
  const tracks = [...document.querySelectorAll('.planet-track')];
  const planets = [...document.querySelectorAll('.skill-planet')];
  return tracks.length === 3 && planets.length === 3 && [...tracks, ...planets].every((track) => {
    const animations = track.getAnimations();
    return animations.length > 0 && animations.every((animation) => animation.playState === expected);
  });
}, state);

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
      headerPosition: getComputedStyle(document.querySelector('.site-header')).position,
      headerDisplay: getComputedStyle(document.querySelector('.site-header')).display
    }));
    assert.ok(overflow.document <= overflow.viewport + 1 && overflow.body <= overflow.viewport + 1, `${size.name} has horizontal overflow: ${JSON.stringify(overflow)}`);
    assert.equal(overflow.headerPosition, 'sticky');
    assert.ok(['flex', 'grid'].includes(overflow.headerDisplay), 'Header must arrange navigation horizontally');
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('main section').count(), 5);
    await page.addScriptTag({ path: path.join(root, 'node_modules/axe-core/axe.min.js') });
    const accessibility = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }));
    await writeFile(path.join(artifacts, `axe-${size.name}.json`), JSON.stringify(accessibility, null, 2));
    assert.deepEqual(accessibility.violations.map((violation) => ({ id: violation.id, impact: violation.impact, nodes: violation.nodes.map((node) => node.target) })), [], `${size.name} accessibility violations`);
    assert.equal(await page.locator('[data-skill-select]').count(), 3);
    assert.equal(await page.locator('[data-skill-tab]').count(), 3);
    for (const key of skillKeys) {
      await page.locator(`[data-skill-tab="${key}"]`).click();
      await assertSelectedSkill(page, key);
      await page.locator(`[data-skill-select="${key}"]`).click();
      await assertSelectedSkill(page, key);
      const panelAccessibility = await page.evaluate(async () => window.axe.run(document.getElementById('skill-explorer'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }));
      assert.deepEqual(panelAccessibility.violations.map((violation) => ({ id: violation.id, nodes: violation.nodes.map((node) => node.target) })), [], `${size.name} ${key} skill accessibility violations`);
    }
    await page.locator('[data-skill-tab="professional"]').click();
    await assertSelectedSkill(page, 'professional');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    if (['desktop', 'mobile'].includes(size.name)) await page.screenshot({ path: path.join(artifacts, `${size.name}.png`), fullPage: true });
    check(`${size.name} (${size.width}px): no overflow, sticky header, five sections, three working skill panels, axe WCAG A/AA clean`);

    await page.locator('.section-nav a[href="#projects"]').click();
    await page.waitForFunction(() => document.querySelector('.section-nav a[aria-current="location"]')?.getAttribute('href') === '#projects');
    assert.equal(new URL(page.url()).hash, '#projects');
    const projectTop = await page.locator('#projects').evaluate((element) => element.getBoundingClientRect().top);
    const headerBox = await page.locator('.site-header').boundingBox();
    assert.ok(Math.abs(headerBox.y) <= 1, `${size.name} header did not remain sticky`);
    assert.ok(projectTop >= headerBox.height - 1 && projectTop < size.height * 0.5, `${size.name} section anchor is hidden by the header or did not scroll: ${projectTop}`);
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
  assert.equal(await keyboard.locator('html').getAttribute('data-motion'), 'off');
  assert.equal(await keyboard.locator('#motion-toggle').getAttribute('aria-pressed'), 'true');
  assert.ok(await keyboard.locator('#motion-toggle').isDisabled(), 'System reduced motion must disable the motion switch');
  assert.ok((await orbitStates(keyboard)).every((track) => track.name === 'none' && track.animations.length === 0));
  assert.equal(await keyboard.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length), 0, 'System reduced motion must stop all page animation');
  check('Keyboard: first-tab skip link, main focus target, visible link focus, reduced motion disables animations and motion switch');

  const assets = await keyboard.evaluate(() => [...new Set([...document.querySelectorAll('[src], link[href]')].map((element) => element.src || element.href).filter((value) => value.includes('/assets/')))]);
  assets.push(`${address}assets/social-card.png`);
  const fonts = await keyboard.evaluate(() => performance.getEntriesByType('resource').map((resource) => resource.name).filter((value) => value.endsWith('.woff2')));
  assert.ok(fonts.length > 0, 'Typography must load a self-hosted WOFF2 font');
  assets.push(...fonts);
  for (const asset of assets) {
    const result = await keyboard.request.get(asset);
    assert.equal(result.status(), 200, `Pages subdirectory asset missing: ${asset}`);
    assert.ok((await result.body()).length > 0);
  }
  const redirect = await keyboard.request.get(`${origin}${base}`, { maxRedirects: 0 });
  assert.equal(redirect.status(), 301);
  assert.equal(redirect.headers().location, `${base}/`);
  check(`Pages subdirectory: ${assets.length} assets respond 200 and base URL redirects correctly`);
  const rootPreview = await keyboard.request.get(`${origin}/`);
  assert.equal(rootPreview.status(), 200, 'Root preview must remain available');
  const rootStyles = await keyboard.request.get(`${origin}/assets/styles.css`);
  assert.equal(rootStyles.status(), 200, 'Root preview assets must remain available');
  check('Root preview: document and stylesheet respond 200');
  await keyboardContext.close();

  const motionContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
  const motion = await motionContext.newPage();
  const motionErrors = [];
  motion.on('pageerror', (error) => motionErrors.push(error.message));
  motion.on('console', (message) => { if (message.type() === 'error') motionErrors.push(message.text()); });
  await motion.goto(address, { waitUntil: 'networkidle' });
  assert.equal(await motion.locator('html').getAttribute('data-motion'), 'on');
  assert.equal(await motion.locator('#motion-toggle').getAttribute('aria-pressed'), 'false');
  assert.ok(await motion.locator('#motion-toggle').isEnabled());
  await motion.locator('#education').evaluate((element) => element.scrollIntoView({ behavior: 'instant', block: 'start' }));
  await motion.mouse.move(1, 1);
  await waitForOrbitState(motion, 'running');
  const movingBefore = await orbitStates(motion);
  const planetsBefore = await planetPositions(motion);
  await new Promise((resolve) => setTimeout(resolve, 160));
  const movingAfter = await orbitStates(motion);
  const planetsAfter = await planetPositions(motion);
  assert.ok(movingAfter.every((track, index) => track.name !== 'none' && track.animations[0].time > movingBefore[index].animations[0].time + 50), 'Orbital tracks must actually advance during normal motion');
  assert.ok(planetsAfter.every((planet, index) => planet.name !== 'none' && Math.hypot(planet.x - planetsBefore[index].x, planet.y - planetsBefore[index].y) > 0.3), 'Orbiting planets must visibly change position');
  await motion.locator('.skill-map').hover();
  await waitForOrbitState(motion, 'paused');
  const pausedBefore = await orbitStates(motion);
  const pausedPlanetsBefore = await planetPositions(motion);
  await new Promise((resolve) => setTimeout(resolve, 160));
  const pausedAfter = await orbitStates(motion);
  const pausedPlanetsAfter = await planetPositions(motion);
  assert.ok(pausedAfter.every((track, index) => Math.abs(track.animations[0].time - pausedBefore[index].animations[0].time) < 5), 'Hovering the orbital map must pause its motion');
  assert.ok(pausedPlanetsAfter.every((planet, index) => planet.states.every((state) => state === 'paused') && Math.hypot(planet.x - pausedPlanetsBefore[index].x, planet.y - pausedPlanetsBefore[index].y) < 0.3), 'Hovering the map must keep planet controls still');
  await motion.mouse.move(1, 1);
  await waitForOrbitState(motion, 'running');
  await motion.locator('[data-skill-select="professional"]').focus();
  await waitForOrbitState(motion, 'paused');
  const focusedPlanetsBefore = await planetPositions(motion);
  await new Promise((resolve) => setTimeout(resolve, 160));
  const focusedPlanetsAfter = await planetPositions(motion);
  assert.ok(focusedPlanetsAfter.every((planet, index) => Math.hypot(planet.x - focusedPlanetsBefore[index].x, planet.y - focusedPlanetsBefore[index].y) < 0.3), 'Keyboard focus must keep planet controls still');
  check('Normal motion: three orbital tracks advance and pause on hover and keyboard focus');

  for (const key of skillKeys) {
    await motion.locator('.skill-map').hover();
    await motion.locator(`[data-skill-select="${key}"]`).click();
    await assertSelectedSkill(motion, key);
  }
  await motion.locator('[data-skill-select="professional"]').focus();
  await motion.keyboard.press('Enter');
  await assertSelectedSkill(motion, 'professional');
  await motion.locator('[data-skill-tab="professional"]').focus();
  for (const [key, expected] of [
    ['ArrowRight', 'academic'], ['ArrowRight', 'learning'], ['ArrowRight', 'professional'],
    ['ArrowLeft', 'learning'], ['Home', 'professional'], ['End', 'learning'],
    ['ArrowUp', 'academic'], ['ArrowDown', 'learning']
  ]) {
    await motion.keyboard.press(key);
    await assertSelectedSkill(motion, expected);
    assert.equal(await motion.evaluate(() => document.activeElement.dataset.skillTab), expected, `${key} must move tab focus`);
  }
  check('Skills: all planets select their panels by click, Enter selects a focused planet, arrows/Home/End manage roving tab focus');

  await motion.locator('#motion-toggle').click();
  assert.equal(await motion.locator('html').getAttribute('data-motion'), 'off');
  assert.equal(await motion.locator('#motion-toggle').getAttribute('aria-pressed'), 'true');
  assert.ok((await orbitStates(motion)).every((track) => track.name === 'none' && track.animations.length === 0));
  assert.equal(await motion.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length), 0, 'Pause must stop both CSS and scripted animation');
  await motion.reload({ waitUntil: 'networkidle' });
  assert.equal(await motion.locator('html').getAttribute('data-motion'), 'off');
  assert.equal(await motion.locator('#motion-toggle').getAttribute('aria-pressed'), 'true');
  assert.ok(await motion.locator('#motion-toggle').isEnabled());
  await motion.locator('#motion-toggle').click();
  assert.equal(await motion.locator('html').getAttribute('data-motion'), 'on');
  await motion.mouse.move(1, 1);
  await waitForOrbitState(motion, 'running');
  assert.deepEqual(motionErrors, [], 'Normal-motion interactions must not produce console or JavaScript errors');
  check('Motion switch: pauses all animation, persists after reload, and resumes on request');
  await motionContext.close();

  const noJSContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJS = await noJSContext.newPage();
  await noJS.goto(address, { waitUntil: 'networkidle' });
  assert.ok((await noJS.locator('h1').innerText()).includes(data.name));
  assert.ok((await noJS.locator('#about').innerText()).includes('Institut Paul Lambin'));
  assert.equal(await noJS.locator('main section').count(), 5);
  assert.equal(await noJS.locator('[data-skill-panel]').count(), 3);
  for (const [index, key] of skillKeys.entries()) {
    const panel = noJS.locator(`[data-skill-panel="${key}"]`);
    assert.ok(await panel.isVisible(), `Without JavaScript the ${key} skill panel must remain readable`);
    assert.equal(await panel.getAttribute('hidden'), null);
    for (const item of data.skills[index].items) assert.ok((await panel.innerText()).includes(item), `Without JavaScript the ${key} skills must remain readable`);
  }
  assert.ok(!await noJS.locator('#motion-toggle').isVisible(), 'Inert motion control must be hidden without JavaScript');
  assert.ok(!await noJS.locator('.skill-tabs').isVisible(), 'Inert tabs must be hidden without JavaScript');
  for (const key of skillKeys) assert.ok(!await noJS.locator(`[data-skill-select="${key}"]`).isVisible(), 'Inert planet controls must be hidden without JavaScript');
  await noJS.locator('.section-nav a[href="#projects"]').click();
  assert.equal(new URL(noJS.url()).hash, '#projects');
  // Poll from Node: page-side polling is intentionally disabled with JavaScript.
  // Native CSS smooth scrolling still needs time to finish.
  let noJSTop;
  let previousNoJSTop;
  let stableNoJSFrames = 0;
  for (let attempt = 0; attempt < 30; attempt++) {
    noJSTop = await noJS.locator('#projects').evaluate((element) => element.getBoundingClientRect().top);
    stableNoJSFrames = Math.abs(noJSTop - previousNoJSTop) < 0.5 ? stableNoJSFrames + 1 : 0;
    if (noJSTop >= 0 && noJSTop < 844 && stableNoJSFrames >= 2) break;
    previousNoJSTop = noJSTop;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const noJSHeader = await noJS.locator('.site-header').boundingBox();
  assert.ok(stableNoJSFrames >= 2, 'Native scrolling must settle before checking its target');
  assert.ok(Math.abs(noJSHeader.y) <= 1, 'Header must stay sticky without JavaScript');
  assert.ok(noJSTop >= noJSHeader.height - 1 && noJSTop < 844, 'Native navigation must work without JavaScript and keep content clear of the sticky header');
  check('JavaScript disabled: identity, all five categories, all skill panels, hidden inert controls, and native anchor navigation work');
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
