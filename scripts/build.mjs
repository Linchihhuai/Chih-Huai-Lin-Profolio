import { mkdir, writeFile, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import data from '../content/portfolio.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const escape = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const url = value => {
  if (!value) return '';
  if (!/^https:\/\//.test(value) && !/^mailto:[^\s@]+@[^\s@]+$/.test(value) && !/^\.\/assets\//.test(value)) throw new Error(`Unsupported public URL: ${value}`);
  return escape(value);
};
const arrow = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const down = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
// Original vector artwork shared by the hero, preview and skills map.
const chip = '<svg viewBox="0 0 120 120" fill="none" aria-hidden="true"><rect x="28" y="28" width="64" height="64" rx="15" stroke="currentColor" stroke-width="3"/><rect x="40" y="40" width="40" height="40" rx="5" stroke="currentColor" stroke-width="2"/><path d="M42 14v14m18-14v14m18-14v14M42 92v14m18-14v14m18-14v14M14 42h14m-14 18h14m-14 18h14M92 42h14M92 60h14M92 78h14M53 52l-7 8 7 8m14-16 7 8-7 8" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const compass = '<svg viewBox="0 0 120 120" fill="none" aria-hidden="true"><circle cx="60" cy="60" r="43" stroke="currentColor" stroke-width="3"/><path d="m77 39-9 29-29 13 13-29 25-13Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M60 10v15m0 70v15M10 60h15m70 0h15" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="60" r="4" fill="currentColor"/></svg>';
const robot = '<svg viewBox="0 0 120 120" fill="none" aria-hidden="true"><rect x="25" y="37" width="70" height="53" rx="15" stroke="currentColor" stroke-width="3"/><path d="M60 37V23M16 55v21m88-21v21M44 77h32" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="18" r="5" stroke="currentColor" stroke-width="3"/><circle cx="44" cy="58" r="5" fill="currentColor"/><circle cx="76" cy="58" r="5" fill="currentColor"/></svg>';
const star = '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="m50 2 7 30 24-20-14 29 31 9-31 9 14 29-24-20-7 30-7-30-24 20 14-29L2 50l31-9-14-29 24 20Z" fill="currentColor"/></svg>';
const icons = { professional: chip, academic: compass, learning: robot };
const tags = items => items?.length ? `<ul class="skill-list">${items.map(t => `<li>${escape(t)}</li>`).join('')}</ul>` : '';
const section = (id, className, body) => {
  const number = String(Object.keys(data.sections).indexOf(id) + 1).padStart(2, '0');
  return `<section id="${id}" class="content-section ${className}" aria-labelledby="${id}-heading"><div class="section-heading" data-reveal><span class="section-number" aria-hidden="true">${number}</span><h2 id="${id}-heading">${escape(data.sections[id])}</h2></div>${body}</section>`;
};
const siteUrl = (process.env.SITE_URL || data.siteUrl).replace(/\/$/, '');
if (siteUrl && !/^https:\/\/[\w.-]+(?:\/[\w/-]*)?$/.test(siteUrl)) throw new Error('SITE_URL must be an HTTPS website URL');
const metaImage = siteUrl ? `${siteUrl}/assets/social-card.png` : './assets/social-card.png';
const headline = data.introduction.headline.map((word, i) => `<span${i === 2 ? ' class="type-accent"' : ''}>${escape(word)}</span>`).join('');
const preview = `<div class="project-preview" aria-hidden="true"><div class="preview-window"><div class="preview-toolbar"><span></span><span></span><span></span><small>CHL / PORTFOLIO</small></div><div class="preview-layout"><div><span class="preview-caption">${escape(data.role)}</span><div class="preview-name">${escape(data.name)}</div><div class="preview-title">${data.introduction.headline.map(escape).join('<br>')}</div></div><div class="preview-art">${chip}</div></div><div class="preview-bottom"><span>SOFTWARE MEETS CURIOSITY</span><b>${arrow}</b></div></div></div>`;
const skills = `<p class="section-intro">${escape(data.statements.skills)}</p><div id="skill-explorer" class="skill-explorer" data-reveal><div class="skill-tabs" role="tablist" aria-label="Areas of experience">${data.skills.map((s, i) => `<button type="button" id="skill-tab-${escape(s.key)}" role="tab" data-skill-tab="${escape(s.key)}" aria-controls="skill-panel-${escape(s.key)}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${escape(s.title)}</button>`).join('')}</div><div class="skills-interactive-layout"><div class="skill-map" role="group" aria-label="Interactive skills orbit" aria-describedby="skill-map-instruction"><div class="map-center" aria-hidden="true">${chip}</div><div class="map-orbit orbit-one" aria-hidden="true"></div><div class="map-orbit orbit-two" aria-hidden="true"></div><div class="map-orbit orbit-three" aria-hidden="true"></div>${data.skills.map((s, i) => `<div class="planet-track track-${['one', 'two', 'three'][i]}"><button class="skill-planet" type="button" data-skill-select="${escape(s.key)}" aria-controls="skill-panel-${escape(s.key)}" aria-pressed="${i === 0}"><span class="planet-icon" aria-hidden="true">${icons[s.key] || chip}</span><span class="planet-label">${escape(s.shortTitle)}</span></button></div>`).join('')}<p id="skill-map-instruction" class="map-instruction">${escape(data.statements.skillsInstruction)}</p></div><div class="skill-panels">${data.skills.map(s => `<div class="skill-panel" id="skill-panel-${escape(s.key)}" data-skill-panel="${escape(s.key)}" role="tabpanel" aria-labelledby="skill-tab-${escape(s.key)}" tabindex="0"><div class="skill-scene"><p class="skill-scene-label">${escape(s.title)}</p><div aria-hidden="true">${s.words.map((w, i) => `<span class="skill-word skill-word--${['primary', 'secondary', 'tertiary'][i]}">${escape(w)}</span>`).join('')}<div class="skill-orbit" data-skill-orbit>${icons[s.key] || chip}</div></div></div><p class="skill-note">${escape(s.description)}</p><ul class="skill-items">${s.items.map(x => `<li>${escape(x)}</li>`).join('')}</ul></div>`).join('')}</div></div></div>`;
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f4f0e8">
  <meta name="description" content="${escape(data.description)}">
  <title>${escape(data.title)}</title>
  <meta property="og:type" content="website">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${escape(data.title)}">
  <meta property="og:description" content="${escape(data.description)}">
  <meta property="og:image" content="${escape(metaImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escape(data.name)} — ${escape(data.role)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escape(data.title)}">
  <meta name="twitter:description" content="${escape(data.description)}">
  <meta name="twitter:image" content="${escape(metaImage)}">
${siteUrl ? `  <link rel="canonical" href="${escape(siteUrl)}/"><meta property="og:url" content="${escape(siteUrl)}/">` : ''}
  <link rel="icon" href="./assets/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="./assets/space-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="./assets/styles.css">
  <script src="./assets/site.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <header class="site-header" id="top">
    <a class="wordmark" href="#top" aria-label="${escape(data.name)} — back to top"><span class="wordmark-mark">${escape(data.initials)}</span><small>Software<br>&amp; systems</small></a>
    <nav class="section-nav" aria-label="Portfolio sections"><ol>${Object.entries(data.sections).map(([id, label], i) => `<li><a href="#${id}"${i === 0 ? ' aria-current="location"' : ''}><span class="nav-number" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span class="nav-label">${escape(label)}</span><span class="nav-line" aria-hidden="true"></span></a></li>`).join('')}</ol></nav>
    <div class="header-actions"><button type="button" id="motion-toggle" aria-pressed="false"><span class="motion-label">Pause motion</span></button><a class="contact-shortcut" href="#contact" aria-label="Go to contact">${arrow}</a></div>
  </header>
  <main id="main-content" tabindex="-1">
    <div class="hero introduction">
      <div class="hero-content"><p class="identity-kicker">${escape(data.introduction.kicker)}</p><h1>${escape(data.name)}</h1><p class="hero-statement">${headline}</p><p class="professional-title">${escape(data.role)}</p><p class="intro-copy">${escape(data.introduction.summary)}</p><div class="hero-actions"><a class="button button-dark" href="#projects" data-magnetic>Explore my work ${arrow}</a><a class="button button-outline" href="#education" data-magnetic>Explore my skills ${arrow}</a>${data.contact.resume ? `<a class="button button-outline" href="${url(data.contact.resume.url)}" download>${escape(data.contact.resume.label)}</a>` : ''}</div></div>
      <div id="hero-art" class="hero-art" aria-hidden="true"><div class="art-scene" data-parallax><div class="art-grid"></div><div class="orbital-ring ring-one"></div><div class="orbital-ring ring-two"></div><div class="art-orb">${chip}</div><span class="art-pill pill-one">SAP / ABAP</span><span class="art-pill pill-two">Computer science</span><span class="art-pill pill-three">Hardware curiosity</span><div class="art-star">${star}</div><span class="art-caption">Code meets the physical world.</span></div></div>
      <div class="hero-bottom"><span class="hero-index">A personal portfolio / ${escape(data.name)}</span><a href="#about" class="scroll-cue">A little more about me ${down}</a></div>
    </div>
    ${section('about', 'lilac-section', `<div class="about-layout"><div class="about-lead" data-reveal><p class="section-statement">${escape(data.statements.about)}</p></div><div class="about-copy" data-reveal>${data.about.map(p => `<p>${escape(p)}</p>`).join('')}</div></div>`)}
    ${section('experience', 'paper-section', `<div class="experience-grid">${data.experience.map(e => `<article class="experience-entry" data-reveal><p class="entry-label">${escape(e.label)}</p><h3>${escape(e.title)}</h3><p class="entry-description">${escape(e.description)}</p>${e.employer ? `<p>${escape(e.employer)}</p>` : ''}${e.dates ? `<p>${escape(e.dates)}</p>` : ''}${e.responsibilities?.length ? `<ul>${e.responsibilities.map(x => `<li>${escape(x)}</li>`).join('')}</ul>` : ''}${tags(e.technologies)}</article>`).join('')}</div>`)}
    ${section('projects', 'ink-section', `<p class="section-intro" data-reveal>${escape(data.projectsIntroduction)}</p>${data.projects.map(p => `<article class="project-card${p.preview === 'portfolio' ? '' : ' project-card-text'}" data-reveal>${p.preview === 'portfolio' ? preview : ''}<div class="project-content"><p class="entry-label">${escape(p.label)}</p><h3>${escape(p.title)}</h3><p>${escape(p.summary)}</p><dl class="project-details">${[['Problem', p.problem], ['Implementation', p.implementation], ['My contribution', p.contribution], ['Status', p.status]].filter(([, v]) => v).map(([k, v]) => `<div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>`).join('')}</dl>${tags(p.technologies)}${p.evidence.map(l => `<a class="project-link" href="${url(l.url)}">${escape(l.label)} ${arrow}</a>`).join('')}</div></article>`).join('')}`)}
    ${section('education', 'paper-section skills-section', `<div class="education-grid">${data.education.map(e => `<article class="education-entry" data-reveal><p class="entry-label">${escape(e.label)}</p><h3>${escape(e.title)}</h3>${e.institution ? `<p>${escape(e.institution)}</p>` : ''}<p class="education-location">${escape(e.location)}</p>${e.dates ? `<p class="education-location">${escape(e.dates)}</p>` : ''}</article>`).join('')}</div>${skills}`)}
    ${section('contact', 'lime-section', `<div class="contact-layout"><h3 class="contact-heading" data-reveal>${escape(data.contact.heading)}</h3><div class="contact-copy" data-reveal><p>${escape(data.contact.description)}</p><div class="contact-links">${data.contact.links.map(l => `<a href="${url(l.url)}"><span>${escape(l.label)} ${arrow}</span><small>${escape(l.detail)}</small></a>`).join('')}</div></div></div>`)}
  </main>
  <footer class="site-footer"><p>${escape(data.footer)}</p><a href="#top">Back to top</a></footer>
</body>
</html>
`;
await mkdir(path.join(root, 'dist'), { recursive: true });
await writeFile(path.join(root, 'index.html'), html);
await writeFile(path.join(root, 'dist/index.html'), html);
await rm(path.join(root, 'dist/assets'), { recursive: true, force: true });
await cp(path.join(root, 'assets'), path.join(root, 'dist/assets'), { recursive: true });
await writeFile(path.join(root, 'dist/.nojekyll'), '');
console.log(`Built static portfolio${siteUrl ? ` for ${siteUrl}/` : ''}`);
