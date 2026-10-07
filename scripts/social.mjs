import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import data from '../content/portfolio.mjs';

const root = fileURLToPath(new URL('../',import.meta.url));
const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lines=[];
for (const word of data.introduction.summary.split(/\s+/)) {
  const last=lines.length-1;
  if (last<0 || `${lines[last]} ${word}`.length>72) lines.push(word);
  else lines[last]+=` ${word}`;
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#101b2d"/><path d="M85 80h80" stroke="#8bdbc9" stroke-width="3"/><text x="85" y="153" font-family="Arial,sans-serif" font-size="20" letter-spacing="4" fill="#8bdbc9">${escape(data.introduction.kicker.toUpperCase())}</text><text x="80" y="290" font-family="Arial,sans-serif" font-size="86" font-weight="700" fill="#e7edf4">${escape(data.name)}</text><text x="85" y="354" font-family="Arial,sans-serif" font-size="32" fill="#e7edf4">${escape(data.role)}</text>${lines.map((line,i)=>`<text x="85" y="${450+i*40}" font-family="Arial,sans-serif" font-size="25" fill="#a9b8ca">${escape(line)}</text>`).join('')}<path d="M85 550h1030" stroke="#304155"/><text x="1115" y="581" text-anchor="end" font-family="Arial,sans-serif" font-size="18" fill="#8bdbc9">${escape(data.initials)}</text></svg>`;
await writeFile(`${root}assets/social-card.svg`,svg);
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({executablePath,headless:true});
try {
  const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
  await page.setContent('<style>html,body{margin:0;width:1200px;height:630px}</style>'+svg);
  await page.screenshot({path:`${root}assets/social-card.png`});
  console.log('Updated social-sharing image from portfolio data.');
} finally { await browser.close(); }
