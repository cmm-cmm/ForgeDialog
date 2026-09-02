/* Shared site chrome: version badge, theme toggle, copy buttons. */
/* Loaded by every page; the page-specific scripts run after it. */
/* global ForgeDialog */

(() => {
  const { setTheme, VERSION } = ForgeDialog;
  const $ = (selector) => document.querySelector(selector);

  $('#version').textContent = `v${VERSION}`;

  /* Theme ---------------------------------------------------------------- */

  const themeToggle = $('#theme-toggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(dark) {
    // setTheme drives the library's own tokens; the attribute it sets on <html>
    // is the same hook this page's stylesheet reads, so both stay in step.
    setTheme(dark ? 'dark' : 'light');
    themeToggle.textContent = dark ? 'Light' : 'Dark';
    themeToggle.setAttribute('aria-pressed', String(dark));
  }

  applyTheme(prefersDark.matches);
  themeToggle.addEventListener('click', () => {
    applyTheme(themeToggle.getAttribute('aria-pressed') !== 'true');
  });

  /* Copy buttons --------------------------------------------------------- */

  for (const button of document.querySelectorAll('.copy')) {
    button.addEventListener('click', async () => {
      const text = $(button.dataset.copy).textContent;
      const original = button.textContent;
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = 'Copied';
      } catch {
        // Clipboard access can be refused; say so rather than looking broken.
        button.textContent = 'Press Ctrl+C';
      }
      setTimeout(() => {
        button.textContent = original;
      }, 1600);
    });
  }
})();
