# Chih-Huai Lin — Professional Portfolio

A static portfolio for Chih-Huai Lin, an SAP ABAP developer and computer science graduate developing practical skills in embedded systems and robotics. A small native Node.js script generates semantic HTML; CSS and browser JavaScript provide the presentation. There is no application framework or backend.

## Interface and motion

The design combines a warm paper background, oversized typography, violet and lime accents, and original engineering illustrations. Sticky horizontal navigation highlights the current section. The orbital skills explorer distinguishes professional SAP/ABAP work, academic foundations, and developing hardware interests; its three groups can be selected with a pointer or keyboard. Use the arrow keys, Home, and End while focused on its tabs.

Illustrations respond gently to a mouse pointer, and sections enter as they are read. **Pause motion** stops decorative movement and remembers the preference locally. System reduced-motion preferences also disable movement, and animation pauses when the page is hidden. All factual content, professional links, and native section navigation remain available without JavaScript; all three skills groups appear as ordinary readable content.

The self-hosted Latin variable font is [Space Grotesk](https://github.com/floriankarsten/space-grotesk), distributed through `@fontsource-variable/space-grotesk@5.3.0`. Its approximately 22 KB WOFF2 file is in `assets/space-grotesk-latin.woff2`; the SIL Open Font License 1.1 and author attribution are preserved in [assets/font-license.txt](assets/font-license.txt). The favicon and social-sharing illustration are original SVG artwork. No font or asset requests leave the site at runtime.

## Develop and check

Use Node.js 24 and the checked-in npm lockfile.

```sh
npm ci
npx playwright install --with-deps chromium
npm test
npm run test:browser
npm run dev
```

Run these commands from the repository checkout. The development server uses port 4173 and supports both `http://localhost:4173/` and `http://localhost:4173/Chih-Huai-Lin-Profolio/`. Its repository path comes from `siteUrl` in the content file. It builds when it starts; rebuild or restart it after changing content. `npm run build` writes `dist/` and refreshes the generated `index.html`. `npm run preview` serves the existing build. `PORT` changes the server port.

`npm test` checks the generated site. The browser checks exercise responsive layouts, navigation, the skills explorer, keyboard use, animation controls, reduced motion, accessibility, console errors, and local assets. Playwright uses its installed Chromium or an existing system Chromium; `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can specify the executable explicitly.

## Update content

Edit **`content/portfolio.mjs`** for the name, introduction, biography, experience, projects, education, skills, and professional links. Presentation lives in `assets/styles.css` and `assets/site.js`; the HTML generator is `scripts/build.mjs`. Keep the content factual and distinguish professional experience from personal learning.

Unknown employers, dates, responsibilities, achievements, project evidence, email addresses, and professional links are intentionally omitted. The `draftExamples` object at the bottom of the data file contains editable sample entries. The build never reads that object, so its examples do not appear publicly. Replace the sample fields with confirmed details, then move a completed entry into the corresponding main `experience`, `education`, or `projects` array. Omit incomplete entries and unavailable links.

Project entries should describe the problem, implementation, personal contribution, technologies, accurate status, and available evidence. Add working project destinations to `evidence` and confirmed contact destinations to `contact.links`.

To offer a résumé, first add the real file as `assets/resume.pdf`, then set `contact.resume` to `{ label: 'Download résumé', url: './assets/resume.pdf' }`. Keep it `null` until the file is available. Never store credentials or private documents in this public repository.

After changing the name or introduction, run `npm run social` to refresh the self-contained SVG and 1200 × 630 PNG in `assets/social-card.*`, then build and check the site. The script embeds the licensed local font and uses the same palette as the portfolio. It supports the installed Playwright browser, system Chromium, and `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. CI refreshes the sharing image before validation and deployment.

## GitHub Pages

The user-selected deployment target is the existing public repository [Linchihhuai/Chih-Huai-Lin-Profolio](https://github.com/Linchihhuai/Chih-Huai-Lin-Profolio). Its expected Pages URL is `https://linchihhuai.github.io/Chih-Huai-Lin-Profolio/`. The workflow is ready in `.github/workflows/pages.yml`; the presence of this workflow does not mean deployment has completed. Confirm the successful deployment and live URL in Actions before sharing it.

In the target repository, enable **Settings → Pages → Build and deployment → Source → GitHub Actions**. Push the implementation to `main` or run **Validate and deploy portfolio** from the Actions tab on `main`. The workflow installs locked dependencies, runs the site and browser checks, then builds and deploys `dist/`. Pull requests run validation with read-only permissions and do not call Pages deployment actions.

The content file records the expected URL in `siteUrl`. During deployment, the build reads the actual URL from `actions/configure-pages` through `SITE_URL`, so canonical and sharing metadata match the selected Pages location. Relative asset URLs and anchor navigation work under the case-sensitive repository subdirectory. A local production build can use `SITE_URL=https://linchihhuai.github.io/Chih-Huai-Lin-Profolio npm run build` to reproduce the configured Pages destination.

After a successful deployment, verify the URL reported by the `github-pages` environment, including the stylesheet, script, favicon, sharing image, section navigation, and mobile layout. Repository creation and Pages configuration require usable GitHub API authentication; a successful Git read alone does not establish those permissions.
