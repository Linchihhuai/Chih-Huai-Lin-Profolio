import { mkdir, writeFile, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import data from '../content/portfolio.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const escape = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url = value => {
  if (!value) return '';
  if (!/^https:\/\//.test(value) && !/^mailto:[^\s@]+@[^\s@]+$/.test(value) && !/^\.\/assets\//.test(value)) throw new Error(`Unsupported public URL: ${value}`);
  return escape(value);
};
const arrow = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const tags = items => items.length ? `<ul class="skill-list">${items.map(t => `<li>${escape(t)}</li>`).join('')}</ul>` : '';
const section = (id, body) => {
  const number = String(Object.keys(data.sections).indexOf(id) + 1).padStart(2, '0');
  return `<section id="${id}" class="content-section" aria-labelledby="${id}-heading"><div class="section-heading"><span class="section-number" aria-hidden="true">${number}</span><h2 id="${id}-heading">${escape(data.sections[id])}</h2></div><div class="section-body">${body}</div></section>`;
};
const siteUrl = (process.env.SITE_URL || data.siteUrl).replace(/\/$/, '');
if (siteUrl && !/^https:\/\/[\w.-]+(?:\/[\w/-]*)?$/.test(siteUrl)) throw new Error('SITE_URL must be an HTTPS website URL');
const preview = `<div class="project-preview" aria-hidden="true"><span class="preview-caption">CHL / PERSONAL PORTFOLIO</span><div class="preview-layout"><div><span class="preview-name">Chih-Huai<br>Lin.</span><span class="preview-role">SAP ABAP Developer</span><span class="preview-rule"></span><span class="preview-rule short"></span></div><div class="preview-code"><span>01 — ABOUT</span><i></i><i></i><i class="short"></i><span>02 — EXPERIENCE</span><i></i><i class="short"></i></div></div><span class="preview-bottom">SOFTWARE MEETS CURIOSITY <b>↗</b></span></div>`;
const metaImage = siteUrl ? `${siteUrl}/assets/social-card.png` : './assets/social-card.png';
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#101b2d">
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
  <link rel="stylesheet" href="./assets/styles.css">
  <script src="./assets/site.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div class="page-shell">
    <header class="introduction" id="top">
      <div class="identity-block">
        <p class="identity-kicker">${escape(data.introduction.kicker)}</p>
        <h1>${escape(data.name)}</h1>
        <p class="professional-title">${escape(data.role)}</p>
        <p class="intro-copy">${escape(data.introduction.summary)}</p>
        <ul class="intro-tags">${data.introduction.tags.map(t => `<li>${escape(t)}</li>`).join('')}</ul>
      </div>
      <nav class="section-nav" aria-label="Portfolio sections"><ol>${Object.entries(data.sections).map(([id,label],i) => `<li><a href="#${id}"${i === 0 ? ' aria-current="location"' : ''}><span class="nav-number">${String(i+1).padStart(2,'0')}</span><span class="nav-label">${escape(label)}</span><span class="nav-line" aria-hidden="true"></span></a></li>`).join('')}</ol></nav>
      <div class="intro-bottom"><div class="intro-links">${data.contact.links.map(l => `<a href="${url(l.url)}">${escape(l.label)} ${arrow}</a>`).join('')}${data.contact.resume ? `<a href="${url(data.contact.resume.url)}" download>${escape(data.contact.resume.label)}</a>` : ''}</div><p class="introduction-note">${escape(data.introduction.note).replace(/\n/g,'<br>')}</p></div>
    </header>
    <main id="main-content" class="content" tabindex="-1">
      ${section('about',data.about.map(p => `<p>${escape(p)}</p>`).join(''))}
      ${section('experience',data.experience.map(e => `<article class="experience-entry"><p class="entry-label">${escape(e.label)}</p><h3>${escape(e.title)}</h3><p class="entry-description">${escape(e.description)}</p>${e.employer ? `<p>${escape(e.employer)}</p>` : ''}${e.dates ? `<p>${escape(e.dates)}</p>` : ''}${e.responsibilities?.length ? `<ul>${e.responsibilities.map(x=>`<li>${escape(x)}</li>`).join('')}</ul>` : ''}${tags(e.technologies)}</article>`).join(''))}
      ${section('projects',`<p class="section-intro">${escape(data.projectsIntroduction)}</p>${data.projects.map(p => `<article class="project-card${p.preview==='portfolio'?'':' project-card-text'}">${p.preview==='portfolio'?preview:''}<div class="project-content"><p class="entry-label">${escape(p.label)}</p><h3>${escape(p.title)}</h3><p>${escape(p.summary)}</p><dl class="project-details">${[['Problem',p.problem],['Implementation',p.implementation],['My contribution',p.contribution],['Status',p.status]].filter(([,v])=>v).map(([k,v]) => `<div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>`).join('')}</dl>${tags(p.technologies)}${p.evidence.map(l => `<a class="project-link" href="${url(l.url)}">${escape(l.label)} ${arrow}</a>`).join('')}</div></article>`).join('')}`)}
      ${section('education',`${data.education.map(e => `<article class="education-entry"><p class="entry-label">${escape(e.label)}</p><h3>${escape(e.title)}</h3>${e.institution ? `<p>${escape(e.institution)}</p>` : ''}<p class="education-location">${escape(e.location)}</p>${e.dates ? `<p class="education-location">${escape(e.dates)}</p>` : ''}</article>`).join('')}<div class="skills-grid">${data.skills.map(s => `<div><h3>${escape(s.title)}</h3><ul>${s.items.map(x=>`<li>${escape(x)}</li>`).join('')}</ul></div>`).join('')}</div>`)}
      ${section('contact',`<h3 class="contact-heading">${escape(data.contact.heading)}</h3><p>${escape(data.contact.description)}</p><div class="contact-links">${data.contact.links.map(l=>`<a href="${url(l.url)}"><span>${escape(l.label)} ${arrow}</span><small>${escape(l.detail)}</small></a>`).join('')}</div>`)}
      <footer class="site-footer"><p>${escape(data.footer)}</p><a href="#top">Back to top <span aria-hidden="true">↑</span></a></footer>
    </main>
  </div>
</body>
</html>
`;
await mkdir(path.join(root,'dist'),{recursive:true});
await writeFile(path.join(root,'index.html'),html);
await writeFile(path.join(root,'dist/index.html'),html);
await rm(path.join(root,'dist/assets'),{recursive:true,force:true});
await cp(path.join(root,'assets'),path.join(root,'dist/assets'),{recursive:true});
await writeFile(path.join(root,'dist/.nojekyll'),'');
console.log(`Built static portfolio${siteUrl ? ` for ${siteUrl}/` : ''}`);
