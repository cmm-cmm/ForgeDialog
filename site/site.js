/* ForgeDialog site behaviour. Plain browser JS against the global build. */
/* global ForgeDialog */

(() => {
  const { alert, confirm, prompt, open, setTheme, VERSION } = ForgeDialog;
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

  /* Hero demos ----------------------------------------------------------- */

  $('#try-alert').addEventListener('click', () => {
    void alert('Focus is trapped here, and returns to the button when this closes.', {
      title: 'Heads up',
    });
  });

  $('#try-confirm').addEventListener('click', async () => {
    const result = await confirm('Escape and the backdrop both resolve this to false.', {
      title: 'Please confirm',
    });
    void alert(`confirm() resolved ${result}.`, { title: 'Result' });
  });

  $('#try-prompt').addEventListener('click', async () => {
    const value = await prompt('Try submitting it empty.', {
      title: 'What should we call you?',
      defaultValue: 'Ada Lovelace',
      validate: (input) => (input.trim() ? true : 'A name is required'),
    });
    if (value !== null) void alert(`Nice to meet you, ${value}.`, { title: 'Result' });
  });

  $('#try-wizard').addEventListener('click', () => openPlayground());

  /* Playground ----------------------------------------------------------- */

  const controls = {
    surface: $('#c-surface'),
    title: $('#c-title'),
    titleBg: $('#c-title-bg'),
    titleBgOn: $('#c-title-bg-on'),
    border: $('#c-border'),
    borderWidth: $('#c-border-width'),
    radius: $('#c-radius'),
    angle: $('#c-angle'),
    distance: $('#c-distance'),
    strength: $('#c-strength'),
    hover: $('#c-hover'),
    draggable: $('#c-draggable'),
  };

  const outputs = {
    borderWidth: $('#o-border-width'),
    radius: $('#o-radius'),
    angle: $('#o-angle'),
    distance: $('#o-distance'),
    strength: $('#o-strength'),
  };

  function readOptions() {
    const appearance = {
      surfaceColor: controls.surface.value,
      titleColor: controls.title.value,
      borderColor: controls.border.value,
      borderWidth: Number(controls.borderWidth.value),
      radius: Number(controls.radius.value),
      shadow: {
        angle: Number(controls.angle.value),
        distance: Number(controls.distance.value),
        blur: 48,
        opacity: Number(controls.strength.value),
      },
    };

    if (controls.titleBgOn.checked) appearance.titleBackground = controls.titleBg.value;
    if (controls.hover.checked) {
      appearance.hover = {
        borderColor: '#ff9f1c',
        titleColor: '#ff9f1c',
        lift: 6,
        scale: 1.02,
        shadow: 'xl',
      };
    }

    return {
      title: 'Styled with the appearance API',
      message:
        'Every colour, the corner radius, and the shadow direction come from the controls on the left. Drag me by the header.',
      appearance,
      draggable: controls.draggable.checked ? { bounds: 'viewport' } : false,
      buttons: [{ text: 'Close', role: 'primary', closesDialog: true }],
    };
  }

  function toSource(options) {
    // JSON gives stable, readable output; the small fixups below turn it into
    // something that can be pasted straight into a source file.
    const body = JSON.stringify(options, null, 2)
      .replace(/"([A-Za-z][A-Za-z0-9]*)":/g, '$1:')
      .replace(/"/g, "'");
    return `import { open } from 'forgedialog';\nimport 'forgedialog/style.css';\n\nopen(${body});`;
  }

  let preview;

  function refresh() {
    outputs.borderWidth.textContent = `${controls.borderWidth.value}px`;
    outputs.radius.textContent = `${controls.radius.value}px`;
    outputs.angle.textContent = `${controls.angle.value}°`;
    outputs.distance.textContent = `${controls.distance.value}px`;
    outputs.strength.textContent = Number(controls.strength.value).toFixed(2);

    const options = readOptions();
    $('#playground-code').textContent = toSource(options);
    preview?.update(options);
  }

  function openPlayground() {
    if (preview?.isOpen()) return;
    preview = open(readOptions());
    preview.whenClosed().then(() => {
      preview = undefined;
    });
  }

  $('#controls').addEventListener('input', refresh);
  $('#open-playground').addEventListener('click', openPlayground);
  refresh();
})();
