import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import data from '../content/portfolio.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = await readFile(path.join(root, 'dist/index.html'), 'utf8');
const attributeValues = (name) => [...html.matchAll(new RegExp(`\\b${name}="([^"]*)"`, 'g'))].map((match) => match[1]);

test('the built document has semantic landmarks, a single identity heading, and all content categories', () => {
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="en">/);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
  assert.match(html, /<main[^>]+id="main-content"[^>]+tabindex="-1"/);
  assert.match(html, /<nav[^>]+aria-label="Portfolio sections"/);
  assert.match(html, /class="skip-link" href="#main-content"/);
  for (const id of ['about', 'experience', 'projects', 'education', 'contact']) {
    assert.match(html, new RegExp(`<section id="${id}"[^>]+aria-labelledby="${id}-heading"`));
    assert.match(html, new RegExp(`<h2 id="${id}-heading">[^<]+</h2>`));
    assert.match(html, new RegExp(`<a href="#${id}"`));
  }
  assert.ok(html.includes(data.name), 'Confirmed identity should be in the built page');
  assert.ok(html.includes(data.role), 'Professional role should be visible');
});

test('every fragment link has one target, and no empty or unsafe public link is emitted', () => {
  const ids = attributeValues('id');
  assert.equal(ids.length, new Set(ids).size, 'Duplicate IDs interfere with navigation and labels');
  const targetIds = new Set(ids);
  for (const href of attributeValues('href')) {
    assert.ok(href && href !== '#', `Invalid empty link: ${href}`);
    assert.ok(!/^(?:javascript:|data:|http:)/i.test(href), `Unsupported public destination: ${href}`);
    if (href.startsWith('#')) assert.ok(targetIds.has(href.slice(1)), `Missing fragment target: ${href}`);
    else if (!href.startsWith('./')) assert.doesNotThrow(() => new URL(href));
  }
  assert.doesNotMatch(html, /href="[^\"]*(?:example\.com|your[-_](?:email|username)|localhost)[^\"]*"/i);
  if (!data.contact.resume) assert.doesNotMatch(html, /<a[^>]+\bdownload(?:\s|>)/);
  for (const label of attributeValues('aria-labelledby')) {
    for (const id of label.split(/\s+/)) assert.ok(targetIds.has(id), `Missing accessible label: ${id}`);
  }
});

test('all public assets resolve from the GitHub Pages repository subdirectory', async () => {
  const base = new URL('https://linchihhuai.github.io/chih_huai_lin_profolio/');
  const assetPaths = [...attributeValues('src'), ...attributeValues('href')].filter((value) => value.startsWith('./assets/'));
  assert.ok(assetPaths.some((value) => value.endsWith('styles.css')));
  assert.ok(assetPaths.some((value) => value.endsWith('site.js')));
  assert.ok(assetPaths.some((value) => value.endsWith('favicon.svg')));
  for (const asset of assetPaths) {
    const resolved = new URL(asset, base);
    assert.ok(resolved.pathname.startsWith('/chih_huai_lin_profolio/assets/'), `Asset escaped the Pages base: ${asset}`);
    assert.ok((await stat(path.join(root, 'dist', asset))).size > 0, `Asset missing or empty: ${asset}`);
  }
  assert.equal(await readFile(path.join(root, 'dist/.nojekyll'), 'utf8'), '');
});

test('search and social metadata describe the real portfolio and include a valid sharing image', async () => {
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
  assert.match(html, /<title>[^<]*Chih-Huai Lin[^<]*<\/title>/);
  for (const attribute of ['description', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    assert.match(html, new RegExp(`<meta name="${attribute}" content="[^\"]+">`));
  }
  for (const property of ['og:type', 'og:title', 'og:description', 'og:image', 'og:image:alt']) {
    assert.match(html, new RegExp(`<meta property="${property}" content="[^\"]+">`));
  }
  const image = await readFile(path.join(root, 'dist/assets/social-card.png'));
  assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'Sharing image must be an actual PNG');
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
  assert.ok(image.length < 500_000, 'Sharing image should remain lightweight');
});

test('the static page remains useful before JavaScript and does not expose the internal content checklist', () => {
  for (const text of [data.about[0], data.experience[0].title, data.education[0].institution]) {
    assert.ok(html.includes(text.replaceAll('&', '&amp;')), 'Important profile content must be in the generated HTML');
  }
  assert.doesNotMatch(html, /\b(?:TODO|TBD|lorem ipsum)\b/i);
  assert.doesNotMatch(html, /content[-_]checklist|INTERNAL-CONTENT|\$\{|undefined|\[object Object\]/);
  const embeddedExpertClaim = /(?:senior|experienced|expert|professional)\s+(?:embedded|robotics)\s+engineer/i;
  assert.doesNotMatch(html, embeddedExpertClaim);
  if (data.draftExamples) {
    for (const entries of Object.values(data.draftExamples)) {
      for (const entry of entries) {
        assert.ok(!html.includes(entry.label), 'Internal example labels must never be published');
        if (entry.employer) assert.ok(!html.includes(entry.employer), 'Example employer must remain internal');
        if (entry.institution) assert.ok(!html.includes(entry.institution), 'Example institution must remain internal');
      }
    }
    for (const project of data.draftExamples.projects || []) {
      assert.ok(!html.includes(project.title), 'Unverified learning project must remain internal');
    }
  }
});
