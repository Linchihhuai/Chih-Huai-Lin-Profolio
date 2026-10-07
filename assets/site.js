(() => {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const motionToggle = document.getElementById("motion-toggle");
  const motionLabel = motionToggle?.querySelector(".motion-label");
  const storageKey = "portfolio.motionPaused";
  let userPaused = false;
  let motionEnabled = false;
  let pageVisible = !document.hidden;

  try {
    userPaused = window.localStorage.getItem(storageKey) === "true";
  } catch {
    // The portfolio also works when storage is unavailable or restricted.
  }

  // Native scrolling, history, and deep links stay available without JS.
  const navigation = document.querySelector(".section-nav");
  const links = [...(navigation?.querySelectorAll('a[href^="#"]') || [])];
  const sections = links
    .map((link) => document.getElementById(link.hash.slice(1)))
    .filter(Boolean);
  let navigationFrame = 0;
  let currentSection = "";

  const updateCurrentSection = () => {
    navigationFrame = 0;
    if (!sections.length) return;
    const readingLine = Math.min(window.innerHeight * 0.3, 220);
    let activeSection = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= readingLine) activeSection = section;
    }
    if (window.scrollY + window.innerHeight >= root.scrollHeight - 3) {
      activeSection = sections[sections.length - 1];
    }
    if (activeSection.id === currentSection) return;
    currentSection = activeSection.id;
    for (const link of links) {
      if (link.hash === `#${currentSection}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  };

  const scheduleNavigation = () => {
    if (!navigationFrame) navigationFrame = window.requestAnimationFrame(updateCurrentSection);
  };

  window.addEventListener("scroll", scheduleNavigation, { passive: true });
  window.addEventListener("resize", scheduleNavigation, { passive: true });
  window.addEventListener("hashchange", scheduleNavigation);
  updateCurrentSection();

  const revealElements = [...document.querySelectorAll("[data-reveal]")];
  let revealObserver;

  const showAllReveals = () => {
    revealObserver?.disconnect();
    for (const element of revealElements) element.classList.add("is-visible");
  };

  // Base CSS leaves content visible. Enable entrances only after installing
  // an observer, and reveal everything if animation is unavailable or paused.
  const prepareReveals = () => {
    if (!motionEnabled || !("IntersectionObserver" in window)) {
      showAllReveals();
      return;
    }
    try {
      revealObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
      for (const element of revealElements) revealObserver.observe(element);
      root.classList.add("has-reveal");
    } catch {
      showAllReveals();
    }
  };

  const panelAnimations = new Set();
  const stopPanelAnimations = () => {
    for (const animation of panelAnimations) animation.cancel();
    panelAnimations.clear();
  };

  const animateSkillWords = (panel) => {
    if (!motionEnabled || !pageVisible) return;
    for (const [index, word] of [...panel.querySelectorAll(".skill-word")].entries()) {
      if (typeof word.animate !== "function") continue;
      const animation = word.animate([
        { opacity: 0.35, transform: "translateY(9px) rotate(-2deg)" },
        { opacity: 1, transform: "translateY(0) rotate(0)" },
      ], {
        duration: 380,
        delay: Math.min(index * 35, 175),
        easing: "cubic-bezier(.22, 1, .36, 1)",
        fill: "backwards",
      });
      panelAnimations.add(animation);
      animation.finished.then(
        () => panelAnimations.delete(animation),
        () => panelAnimations.delete(animation),
      );
    }
  };

  const explorer = document.getElementById("skill-explorer");
  const tabCandidates = [...(explorer?.querySelectorAll("[data-skill-tab]") || [])];
  const skillSelectors = [...(explorer?.querySelectorAll("[data-skill-select]") || [])];
  const panels = [...(explorer?.querySelectorAll("[data-skill-panel]") || [])];
  const tabs = tabCandidates.filter((tab) => panels.some((panel) => (
    panel.id === tab.getAttribute("aria-controls") &&
    panel.dataset.skillPanel === tab.dataset.skillTab
  )));
  let activeTab;

  const selectSkillTab = (tab, { focus = false, animate = true } = {}) => {
    if (!tabs.includes(tab)) return;
    const nextPanel = panels.find((panel) => panel.id === tab.getAttribute("aria-controls"));
    if (!nextPanel) return;
    const changed = activeTab !== tab;
    activeTab = tab;
    for (const candidate of tabs) {
      const selected = candidate === tab;
      candidate.setAttribute("aria-selected", String(selected));
      candidate.tabIndex = selected ? 0 : -1;
      candidate.classList.toggle("is-active", selected);
    }
    for (const selector of skillSelectors) {
      const selected = selector.dataset.skillSelect === tab.dataset.skillTab;
      selector.setAttribute("aria-pressed", String(selected));
      selector.classList.toggle("is-active", selected);
    }
    for (const panel of panels) {
      const selected = panel === nextPanel;
      panel.hidden = !selected;
      panel.classList.toggle("is-active", selected);
    }
    if (focus) tab.focus({ preventScroll: true });
    if (changed) {
      stopPanelAnimations();
      if (animate) animateSkillWords(nextPanel);
      scheduleNavigation();
    }
  };

  if (tabs.length && tabs.length === tabCandidates.length) {
    for (const tab of tabs) {
      tab.addEventListener("click", () => selectSkillTab(tab));
      tab.addEventListener("keydown", (event) => {
        const index = tabs.indexOf(tab);
        let nextIndex;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          nextIndex = (index + 1) % tabs.length;
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          nextIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = tabs.length - 1;
        else return;
        event.preventDefault();
        selectSkillTab(tabs[nextIndex], { focus: true });
      });
    }
    for (const selector of skillSelectors) {
      const tab = tabs.find((candidate) => candidate.dataset.skillTab === selector.dataset.skillSelect);
      if (tab) selector.addEventListener("click", () => selectSkillTab(tab));
    }
    selectSkillTab(
      tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0],
      { animate: false },
    );
    explorer.dataset.enhanced = "true";
    root.classList.add("has-skill-tabs");
  }

  const effects = [];
  const pendingEffects = new Map();
  let pointerFrame = 0;
  const canMovePointer = () => motionEnabled && pageVisible && finePointer.matches;
  const clamp = (value) => Math.min(1, Math.max(-1, value));

  const resetEffect = (effect) => {
    effect.element.style.setProperty(effect.xVariable, `0${effect.unit}`);
    effect.element.style.setProperty(effect.yVariable, `0${effect.unit}`);
  };

  const resetPointers = () => {
    if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    pendingEffects.clear();
    for (const effect of effects) resetEffect(effect);
  };

  const updatePointers = () => {
    pointerFrame = 0;
    if (!canMovePointer()) {
      resetPointers();
      return;
    }
    // Batch box reads before CSS variable writes. A still pointer or hidden
    // page does not run a continuous animation loop.
    const updates = [];
    for (const [effect, point] of pendingEffects) {
      const box = effect.element.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      const x = clamp(((point.x - box.left) / box.width - 0.5) * 2);
      const y = clamp(((point.y - box.top) / box.height - 0.5) * 2);
      updates.push({ effect, x, y });
    }
    pendingEffects.clear();
    for (const { effect, x, y } of updates) {
      const xValue = effect.orbit ? -y * effect.maximum : x * effect.maximum;
      const yValue = effect.orbit ? x * effect.maximum : y * effect.maximum;
      effect.element.style.setProperty(effect.xVariable, `${xValue.toFixed(2)}${effect.unit}`);
      effect.element.style.setProperty(effect.yVariable, `${yValue.toFixed(2)}${effect.unit}`);
    }
  };

  const addPointerEffect = (element, options) => {
    if (!element) return;
    const effect = { element, ...options };
    effects.push(effect);
    element.addEventListener("pointermove", (event) => {
      if (!canMovePointer() || event.pointerType === "touch") return;
      pendingEffects.set(effect, { x: event.clientX, y: event.clientY });
      if (!pointerFrame) pointerFrame = window.requestAnimationFrame(updatePointers);
    }, { passive: true });
    element.addEventListener("pointerleave", () => {
      pendingEffects.delete(effect);
      resetEffect(effect);
    }, { passive: true });
  };

  addPointerEffect(document.getElementById("hero-art"), {
    xVariable: "--pointer-x", yVariable: "--pointer-y", maximum: 12, unit: "px",
  });
  for (const element of document.querySelectorAll("[data-magnetic]")) {
    addPointerEffect(element, {
      xVariable: "--magnetic-x", yVariable: "--magnetic-y", maximum: 6, unit: "px",
    });
  }
  for (const element of document.querySelectorAll("[data-skill-orbit]")) {
    addPointerEffect(element, {
      xVariable: "--orbit-rotate-x", yVariable: "--orbit-rotate-y",
      maximum: 7, unit: "deg", orbit: true,
    });
  }

  const synchronizeMotion = () => {
    motionEnabled = !reduceMotion.matches && !userPaused;
    root.dataset.motion = motionEnabled ? "on" : "off";
    root.dataset.pageVisible = String(pageVisible);
    if (motionToggle) {
      motionToggle.setAttribute("aria-pressed", String(!motionEnabled));
      motionToggle.disabled = reduceMotion.matches;
      motionToggle.title = reduceMotion.matches ? "Your system prefers reduced motion" : "";
      if (motionLabel) motionLabel.textContent = motionEnabled ? "Pause motion" : "Motion off";
      root.classList.add("has-motion");
    }
    if (!motionEnabled || !pageVisible) {
      resetPointers();
      stopPanelAnimations();
    }
    if (!motionEnabled) showAllReveals();
  };

  motionToggle?.addEventListener("click", () => {
    userPaused = !userPaused;
    try {
      window.localStorage.setItem(storageKey, String(userPaused));
    } catch {
      // Respect the current-page preference without requiring persistence.
    }
    synchronizeMotion();
  });

  const onMediaChange = (query, callback) => {
    if (typeof query.addEventListener === "function") query.addEventListener("change", callback);
    else query.addListener(callback);
  };
  onMediaChange(reduceMotion, synchronizeMotion);
  onMediaChange(finePointer, resetPointers);
  window.addEventListener("resize", resetPointers, { passive: true });
  document.addEventListener("visibilitychange", () => {
    pageVisible = !document.hidden;
    synchronizeMotion();
    if (pageVisible) scheduleNavigation();
  });
  window.addEventListener("pagehide", () => {
    pageVisible = false;
    synchronizeMotion();
    if (navigationFrame) window.cancelAnimationFrame(navigationFrame);
    navigationFrame = 0;
  });
  window.addEventListener("pageshow", () => {
    pageVisible = !document.hidden;
    synchronizeMotion();
    scheduleNavigation();
  });

  synchronizeMotion();
  prepareReveals();
})();
