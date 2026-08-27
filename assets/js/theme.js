/* AquaLux global dark/light theme controller.
   Loaded by every HTML page so the same preference follows Admin, Staff,
   Customer, public, login and error screens. */
(function () {
  'use strict';

  const STORAGE_KEY = 'aqualuxTheme';
  const VALID = new Set(['light', 'dark']);
  const path = window.location.pathname.toLowerCase();
  const defaultTheme = /\/pages\/(admin|staff|customer)\//.test(path) ? 'light' : 'dark';
  function readStoredTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
  }
  function storeTheme(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) { /* direct file previews can block storage */ }
  }
  const saved = readStoredTheme();
  const initialTheme = VALID.has(saved) ? saved : defaultTheme;

  document.documentElement.setAttribute('data-theme', initialTheme);
  document.documentElement.style.colorScheme = initialTheme;

  // Load the final theme override stylesheet after the page's own styles.
  const source = document.currentScript && document.currentScript.src;
  if (source && !document.querySelector('link[data-aqualux-theme-css]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('../css/theme.css?v=20260827', source).href;
    stylesheet.setAttribute('data-aqualux-theme-css', 'true');
    document.head.appendChild(stylesheet);
  }

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function setTheme(theme) {
    const next = VALID.has(theme) ? theme : 'light';
    document.documentElement.setAttribute('data-theme', next);
    document.documentElement.style.colorScheme = next;
    storeTheme(next);
    syncAllToggles();
    window.dispatchEvent(new CustomEvent('aqualux:themechange', { detail: { theme: next } }));
  }

  function syncToggle(button) {
    const dark = currentTheme() === 'dark';
    button.innerHTML = `<span aria-hidden="true">${dark ? '☀' : '☾'}</span><b>${dark ? 'Light' : 'Dark'} mode</b>`;
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('title', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  function syncAllToggles() {
    document.querySelectorAll('.theme-toggle').forEach(syncToggle);
  }

  function bindToggle(button) {
    if (button.dataset.aqualuxThemeBound === 'true') {
      syncToggle(button);
      return;
    }
    button.dataset.aqualuxThemeBound = 'true';
    button.type = 'button';
    button.classList.add('theme-toggle', 'aqualux-theme-toggle');
    button.setAttribute('aria-label', 'Switch dark and light mode');
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
    syncToggle(button);
  }

  function createToggle(floating) {
    const button = document.createElement('button');
    if (floating) button.classList.add('theme-toggle-floating');
    bindToggle(button);
    return button;
  }

  function insertThemeToggle() {
    const isWorkspace = Boolean(document.querySelector('.page-shell')) || /\/pages\/(admin|staff|customer)\//.test(path);
    document.body.classList.add(isWorkspace ? 'theme-internal-page' : 'theme-public-page');

    // If another shared script already created the Admin/Staff toggle, reuse it.
    const existing = document.querySelector('.theme-toggle');
    if (existing) {
      bindToggle(existing);
      return;
    }

    const topbar = document.querySelector('.topbar');
    if (topbar) {
      const lastGroup = topbar.querySelector(':scope > div:last-child');
      const toggle = createToggle(false);
      if (lastGroup) {
        const badge = lastGroup.querySelector('.badge');
        if (badge) lastGroup.insertBefore(toggle, badge);
        else lastGroup.appendChild(toggle);
      } else {
        topbar.appendChild(toggle);
      }
      return;
    }

    const homeHeader = document.querySelector('.header .header-inner');
    if (homeHeader) {
      homeHeader.appendChild(createToggle(false));
      return;
    }

    const customerAiHeader = document.querySelector('.customer-ai-header');
    if (customerAiHeader) {
      customerAiHeader.appendChild(createToggle(false));
      return;
    }

    const aiTopbar = document.querySelector('.ai-topbar');
    if (aiTopbar) {
      aiTopbar.appendChild(createToggle(false));
      return;
    }

    // Login, register and small error screens do not have the dashboard topbar.
    document.body.appendChild(createToggle(true));
  }

  document.addEventListener('DOMContentLoaded', function () {
    insertThemeToggle();
    syncAllToggles();
  });

  window.AquaLuxTheme = { get: currentTheme, set: setTheme };
})();
