/* Shared site chrome: version badge, theme toggle, copy buttons. */
/* Loaded by every page; the page-specific scripts run after it. */
/* The four strings it can write are read off the elements, so the Vietnamese
   pages localise them in markup and this file stays one shared script. */
/* global ForgeDialog */

(() => {
  const { setTheme, setLabels, VERSION } = ForgeDialog;
  const $ = (selector) => document.querySelector(selector);

  $('#version').textContent = `v${VERSION}`;

  // The library ships English button labels. A page in another language passes
  // its own under `labels` in the strings block, so the dialogs the demos open
  // are in the same language as the page around them.
  const strings = JSON.parse($('#fd-strings')?.textContent ?? '{}');
  if (strings.labels) setLabels(strings.labels);

  /* Theme ---------------------------------------------------------------- */

  const themeToggle = $('#theme-toggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(dark) {
    // setTheme drives the library's own tokens; the attribute it sets on <html>
    // is the same hook this page's stylesheet reads, so both stay in step.
    setTheme(dark ? 'dark' : 'light');
    // The label names what the button switches TO, not the current theme.
    themeToggle.textContent = dark
      ? (themeToggle.dataset.labelLight ?? 'Light')
      : (themeToggle.dataset.labelDark ?? 'Dark');
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
        button.textContent = button.dataset.copied ?? 'Copied';
      } catch {
        // Clipboard access can be refused; say so rather than looking broken.
        button.textContent = button.dataset.copyFallback ?? 'Press Ctrl+C';
      }
      setTimeout(() => {
        button.textContent = original;
      }, 1600);
    });
  }
})();
