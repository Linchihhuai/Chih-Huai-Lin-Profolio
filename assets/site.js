(() => {
  "use strict";

  const navigation = document.querySelector(".section-nav");
  if (!navigation) return;

  const links = [...navigation.querySelectorAll('a[href^="#"]')];
  const sections = links
    .map((link) => document.getElementById(link.hash.slice(1)))
    .filter(Boolean);
  if (!sections.length) return;

  let frameRequested = false;
  let currentSection = "";

  const updateCurrentSection = () => {
    frameRequested = false;
    // Keep the section that has crossed the reading line selected until the
    // next one reaches it. This also works when sections are unusually tall.
    const readingLine = Math.min(window.innerHeight * 0.3, 220);
    let activeSection = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= readingLine) activeSection = section;
    }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3) {
      activeSection = sections[sections.length - 1];
    }
    if (activeSection.id === currentSection) return;
    currentSection = activeSection.id;
    for (const link of links) {
      if (link.hash === `#${currentSection}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  };

  const scheduleUpdate = () => {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(updateCurrentSection);
  };

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });
  window.addEventListener("hashchange", scheduleUpdate);
  window.addEventListener("pageshow", scheduleUpdate);
  updateCurrentSection();
})();
