/* Demo-page behaviour. Every card's button really calls the library, and the
   snippet beside it is the call being made, so the page cannot drift from what
   it documents. The shared chrome (version badge, theme toggle, copy buttons)
   lives in common.js. */
(() => {
  const {
    alert,
    confirm,
    prompt,
    open,
    drawer,
    bottomSheet,
    toast,
    lightbox,
    loading,
    commandPalette,
    notificationCenter,
    getNotificationHistory,
    clearNotificationHistory,
    form,
    formWizard,
    wizard,
    setTheme,
    setThemePreset,
    registerPlugin,
  } = ForgeDialog;

  // Localisable strings come from a JSON data block in the page — a data
  // block, not an executable script, so `script-src 'self'` allows it. The
  // Vietnamese page supplies its own set; English is the fallback.
  const strings = JSON.parse(document.getElementById('fd-strings')?.textContent ?? '{}');
  const t = (key, fallback) => strings[key] ?? fallback;

  const logEl = document.getElementById('demo-log');

  function print(label, value) {
    const time = new Date().toLocaleTimeString();
    const text = value === undefined ? '' : `: ${JSON.stringify(value)}`;
    logEl.textContent = `[${time}] ${label}${text}\n${logEl.textContent}`;
  }

  // Lifecycle hooks are easiest to believe when you can watch them fire.
  registerPlugin({
    name: 'site-demo-logger',
    hooks: {
      afterOpen: (ctx) => print('hook:afterOpen', ctx.instance.id),
      afterClose: (ctx) => print('hook:afterClose', ctx.instance.id),
    },
  });

  const demos = {
    async alert() {
      await alert(t('alertBody', 'This is an alert dialog.'), {
        title: t('alertTitle', 'Heads up'),
      });
      print('alert()', 'closed');
    },

    async confirm() {
      print(
        'confirm()',
        await confirm(t('confirmBody', 'Are you sure you want to continue?'), {
          title: t('confirmTitle', 'Please confirm'),
        }),
      );
    },

    async prompt() {
      print(
        'prompt()',
        await prompt(t('promptBody', 'What is your name?'), {
          title: t('promptTitle', 'Introduce yourself'),
          defaultValue: 'Ada Lovelace',
        }),
      );
    },

    async 'prompt-validate'() {
      print(
        'prompt() validated',
        await prompt(t('validateBody', 'Enter an even number:'), {
          title: t('validateTitle', 'Validated prompt'),
          validate: (value) => {
            const n = Number(value);
            if (Number.isNaN(n)) return t('validateNaN', 'Please enter a number');
            if (n % 2 !== 0) return t('validateOdd', 'Number must be even');
            return true;
          },
        }),
      );
    },

    async open() {
      const instance = open({
        title: t('openTitle', 'Custom dialog'),
        content: (container) => {
          const p = document.createElement('p');
          p.textContent = t('openBody', 'This dialog was built with the generic open() API.');
          container.append(p);
        },
        buttons: [
          {
            text: t('close', 'Close'),
            role: 'primary',
            autoFocus: true,
            onClick: (i) => i.close('done'),
          },
        ],
      });
      print('open()', await instance.whenClosed());
    },

    async stacked() {
      const first = confirm(t('stackedFirst', 'First dialog. Open a second one on top?'), {
        title: t('stackedFirstTitle', 'Dialog 1'),
      });
      print(
        'stacked: second',
        await confirm(t('stackedSecond', 'This is stacked above the first dialog.'), {
          title: t('stackedSecondTitle', 'Dialog 2'),
        }),
      );
      print('stacked: first', await first);
    },

    async 'no-animation'() {
      await alert(t('noAnimBody', 'This alert opens and closes instantly.'), { animation: 'none' });
      print('alert() animation:none', 'closed');
    },

    async slide() {
      print(
        'confirm() animation:slide',
        await confirm(t('slideBody', 'This dialog slides in from below.'), {
          animation: 'slide',
        }),
      );
    },

    drawer() {
      drawer({
        title: t('drawerTitle', 'Project settings'),
        message: t('drawerBody', 'A native, focus-safe right drawer.'),
        side: 'right',
        buttons: [{ text: t('done', 'Done'), role: 'primary', closesDialog: true }],
      });
    },

    'drawer-left'() {
      drawer({
        title: t('drawerLeftTitle', 'Navigation'),
        message: t('drawerLeftBody', 'The same drawer, anchored to the left.'),
        side: 'left',
        buttons: [{ text: t('done', 'Done'), role: 'primary', closesDialog: true }],
      });
    },

    sheet() {
      bottomSheet({
        title: t('sheetTitle', 'Quick actions'),
        message: t('sheetBody', 'Drag down to dismiss this sheet.'),
        buttons: [{ text: t('done', 'Done'), role: 'primary', closesDialog: true }],
      });
    },

    'toast-success'() {
      toast(t('toastSuccess', 'Changes saved successfully.'), { tone: 'success' });
    },

    'toast-error'() {
      toast(t('toastError', 'That upload failed. Nothing was lost.'), { tone: 'error' });
    },

    'toast-action'() {
      toast(t('toastAction', 'Message archived.'), {
        tone: 'info',
        actions: [{ text: t('undo', 'Undo'), onClick: () => print('toast action', 'undo') }],
      });
    },

    lightbox() {
      lightbox('./og-image.png', {
        alt: t('lightboxAlt', 'The Forge Dialog social card'),
        caption: t('lightboxCaption', 'Rendered from site/icon.svg at build time.'),
      });
    },

    async loading() {
      const task = loading(t('loadingUploading', 'Uploading…'));
      print('loading()', 'opened');
      await new Promise((resolve) => setTimeout(resolve, 900));
      task.update(t('loadingProcessing', 'Processing…'));
      await new Promise((resolve) => setTimeout(resolve, 900));
      await task.close();
      print('loading()', 'closed');
    },

    commands() {
      commandPalette([
        {
          id: 'theme-dark',
          label: t('cmdDark', 'Switch to dark theme'),
          keywords: ['appearance'],
          run: () => setTheme('dark'),
        },
        {
          id: 'theme-light',
          label: t('cmdLight', 'Switch to light theme'),
          keywords: ['appearance'],
          run: () => setTheme('light'),
        },
        {
          id: 'preset-glass',
          label: t('cmdGlass', 'Use the glass preset'),
          keywords: ['theme', 'appearance'],
          run: () => setThemePreset('glass'),
        },
      ]);
    },

    notifications() {
      print('getNotificationHistory()', getNotificationHistory().length);
      notificationCenter();
    },

    'notifications-clear'() {
      clearNotificationHistory();
      print('clearNotificationHistory()', 'history emptied');
    },

    async form() {
      print(
        'form()',
        await form(
          [
            { name: 'email', type: 'email', label: t('fieldEmail', 'Email'), required: true },
            {
              name: 'plan',
              type: 'select',
              label: t('fieldPlan', 'Plan'),
              options: [
                { value: 'free', label: t('planFree', 'Free') },
                { value: 'pro', label: t('planPro', 'Pro') },
              ],
            },
            { name: 'notes', type: 'textarea', label: t('fieldNotes', 'Notes'), rows: 3 },
          ],
          { title: t('formTitle', 'Create an account') },
        ),
      );
    },

    async wizard() {
      const flow = wizard({
        initialData: { name: '' },
        steps: [
          {
            id: 'profile',
            title: t('wizardStep1', 'Your profile'),
            render: (el, ctx) => {
              const input = document.createElement('input');
              input.className = 'fd-input';
              input.placeholder = t('fieldName', 'Name');
              input.addEventListener('input', () => ctx.set({ name: input.value }));
              el.append(input);
            },
            validate: (ctx) =>
              ctx.data.name ? true : t('wizardRequired', 'Please enter your name.'),
          },
          {
            id: 'review',
            title: t('wizardStep2', 'Review'),
            render: (el, ctx) => {
              el.textContent = `${t('wizardReview', 'Ready to welcome')} ${ctx.data.name}.`;
            },
          },
        ],
      });
      print('wizard()', await flow.result);
    },

    async 'form-wizard'() {
      print(
        'formWizard()',
        await formWizard([
          {
            id: 'account',
            title: t('fwStep1', 'Account'),
            fields: [
              { name: 'email', type: 'email', label: t('fieldEmail', 'Email'), required: true },
            ],
          },
          {
            id: 'profile',
            title: t('fwStep2', 'Profile'),
            fields: [
              {
                name: 'name',
                type: 'text',
                label: t('fieldFullName', 'Full name'),
                required: true,
              },
            ],
          },
        ]),
      );
    },
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-demo], [data-theme], [data-preset]');
    if (!trigger) return;

    if (trigger.dataset.theme) {
      setTheme(trigger.dataset.theme);
      print('setTheme()', trigger.dataset.theme);
      return;
    }
    if (trigger.dataset.preset) {
      setThemePreset(trigger.dataset.preset);
      print('setThemePreset()', trigger.dataset.preset);
      return;
    }

    const run = demos[trigger.dataset.demo];
    // A demo that threw should say so in the log rather than only in the
    // console, since the log is the page's own record of what happened.
    Promise.resolve()
      .then(run)
      .catch((error) => print(`${trigger.dataset.demo} failed`, String(error)));
  });
})();
