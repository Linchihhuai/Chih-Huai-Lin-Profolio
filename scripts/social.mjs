import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import data from '../content/portfolio.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));
const font = (await readFile(`${root}assets/space-grotesk-latin.woff2`)).toString('base64');

// Keep the sharing artwork self-contained, including the licensed local font.
const nameWords = data.name.trim().split(/\s+/);
const nameLines = nameWords.length > 1
  ? [nameWords.slice(0, -1).join(' '), nameWords.at(-1)]
  : [data.name];
const summaryLines = [];
for (const word of data.introduction.summary.trim().split(/\s+/)) {
  const last = summaryLines.length - 1;
  if (last < 0 || `${summaryLines[last]} ${word}`.length > 52) summaryLines.push(word);
  else summaryLines[last] += ` ${word}`;
}
const nameSize = Math.min(98, Math.floor(590 / Math.max(...nameLines.map(line => line.length)) * 1.6));
const roleY = nameLines.length > 1 ? 415 : 312;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escape(`${data.name} — ${data.role}`)}">
  <style>@font-face{font-family:Space;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:300 700}text{font-family:Space,Arial,sans-serif}</style>
  <rect width="1200" height="630" fill="#f4f0e8"/>
  <rect x="48" y="45" width="48" height="48" rx="24" fill="#24202c"/>
  <text x="72" y="75" text-anchor="middle" font-size="16" font-weight="700" fill="#f4f0e8">${escape(data.initials)}</text>
  <text x="112" y="75" font-size="15" font-weight="600" letter-spacing="2" fill="#24202c">PROFESSIONAL PORTFOLIO</text>
  <path d="M48 118H1152" fill="none" stroke="#24202c" stroke-opacity=".18"/>
  <text x="59" y="178" font-size="16" font-weight="500" letter-spacing="2" fill="#6745f5">${escape(data.introduction.kicker.toUpperCase())}</text>
  ${nameLines.map((line, index) => `<text x="54" y="${284 + index * 102}" font-size="${nameSize}" font-weight="700" letter-spacing="-6" fill="#24202c">${escape(line)}</text>`).join('')}
  <text x="60" y="${roleY + 21}" font-size="30" font-weight="500" fill="#24202c">${escape(data.role)}</text>
  ${summaryLines.slice(0, 3).map((line, index) => `<text x="60" y="${roleY + 67 + index * 29}" font-size="20" fill="#5c5663">${escape(line)}</text>`).join('')}
  <g transform="translate(914 320)">
    <circle r="213" fill="#dfd1fc"/>
    <g fill="none" stroke="#24202c" stroke-width="1.6" stroke-opacity=".58" transform="rotate(-24)">
      <ellipse rx="250" ry="118"/>
      <ellipse rx="206" ry="166"/>
      <ellipse rx="148" ry="92"/>
    </g>
    <circle cx="-141" cy="-137" r="32" fill="#d9fa65" stroke="#24202c" stroke-width="2"/>
    <circle cx="208" cy="-60" r="23" fill="#ffc79d" stroke="#24202c" stroke-width="2"/>
    <circle cx="-191" cy="115" r="18" fill="#6745f5" stroke="#24202c" stroke-width="2"/>
    <circle cx="57" cy="165" r="37" fill="#6745f5" stroke="#24202c" stroke-width="2"/>
    <path d="M-16 -80v22m32-22v22m-32 116v22m32-22v22m-96-96h22m-22 32h22m116-32h22m-22 32h22" stroke="#24202c" stroke-width="3"/>
    <rect x="-58" y="-58" width="116" height="116" rx="20" fill="#24202c"/>
    <rect x="-42" y="-42" width="84" height="84" rx="10" fill="none" stroke="#d9fa65" stroke-width="2"/>
    <text y="12" text-anchor="middle" font-size="34" font-weight="600" fill="#d9fa65">${escape(data.initials)}</text>
    <path d="M-142-178v-10m-5 5h10m151 77v-10m-5 5h10m109 159v-10m-5 5h10" stroke="#24202c" stroke-width="2"/>
  </g>
  <path d="M48 563H1152" fill="none" stroke="#24202c" stroke-opacity=".18"/>
  <text x="60" y="603" font-size="16" fill="#24202c">${escape(data.introduction.tags.join('  /  '))}</text>
  <path d="M1112 584h27m-11-11 11 11-11 11" fill="none" stroke="#6745f5" stroke-width="3"/>
</svg>`;

await writeFile(`${root}assets/social-card.svg`, svg);
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent('<style>html,body{margin:0;width:1200px;height:630px}</style>' + svg);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${root}assets/social-card.png` });
  console.log('Updated 1200 × 630 social-sharing artwork from portfolio data.');
} finally {
  await browser.close();
}
