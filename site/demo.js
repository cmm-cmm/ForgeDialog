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
      await alert('This is an alert dialog.', { title: 'Heads up' });
      print('alert()', 'closed');
    },

    async confirm() {
      print(
        'confirm()',
        await confirm('Are you sure you want to continue?', {
          title: 'Please confirm',
        }),
      );
    },

    async prompt() {
      print(
        'prompt()',
        await prompt('What is your name?', {
          title: 'Introduce yourself',
          defaultValue: 'Ada Lovelace',
        }),
      );
    },

    async 'prompt-validate'() {
      print(
        'prompt() validated',
        await prompt('Enter an even number:', {
          title: 'Validated prompt',
          validate: (value) => {
            const n = Number(value);
            if (Number.isNaN(n)) return 'Please enter a number';
            if (n % 2 !== 0) return 'Number must be even';
            return true;
          },
        }),
      );
    },

    async open() {
      const instance = open({
        title: 'Custom dialog',
        content: (container) => {
          const p = document.createElement('p');
          p.textContent = 'This dialog was built with the generic open() API.';
          container.append(p);
        },
        buttons: [
          { text: 'Close', role: 'primary', autoFocus: true, onClick: (i) => i.close('done') },
        ],
      });
      print('open()', await instance.whenClosed());
    },

    async stacked() {
      const first = confirm('First dialog. Open a second one on top?', { title: 'Dialog 1' });
      print(
        'stacked: second',
        await confirm('This is stacked above the first dialog.', {
          title: 'Dialog 2',
        }),
      );
      print('stacked: first', await first);
    },

    async 'no-animation'() {
      await alert('This alert opens and closes instantly.', { animation: 'none' });
      print('alert() animation:none', 'closed');
    },

    async slide() {
      print(
        'confirm() animation:slide',
        await confirm('This dialog slides in from below.', {
          animation: 'slide',
        }),
      );
    },

    drawer() {
      drawer({
        title: 'Project settings',
        message: 'A native, focus-safe right drawer.',
        side: 'right',
        buttons: [{ text: 'Done', role: 'primary', closesDialog: true }],
      });
    },

    'drawer-left'() {
      drawer({
        title: 'Navigation',
        message: 'The same drawer, anchored to the left.',
        side: 'left',
        buttons: [{ text: 'Done', role: 'primary', closesDialog: true }],
      });
    },

    sheet() {
      bottomSheet({
        title: 'Quick actions',
        message: 'Drag down to dismiss this sheet.',
        buttons: [{ text: 'Done', role: 'primary', closesDialog: true }],
      });
    },

    'toast-success'() {
      toast('Changes saved successfully.', { tone: 'success' });
    },

    'toast-error'() {
      toast('That upload failed. Nothing was lost.', { tone: 'error' });
    },

    'toast-action'() {
      toast('Message archived.', {
        tone: 'info',
        actions: [{ text: 'Undo', onClick: () => print('toast action', 'undo') }],
      });
    },

    lightbox() {
      lightbox('./og-image.png', {
        alt: 'The Forge Dialog social card',
        caption: 'Rendered from site/icon.svg at build time.',
      });
    },

    async loading() {
      const task = loading('Uploading…');
      print('loading()', 'opened');
      await new Promise((resolve) => setTimeout(resolve, 900));
      task.update('Processing…');
      await new Promise((resolve) => setTimeout(resolve, 900));
      await task.close();
      print('loading()', 'closed');
    },

    commands() {
      commandPalette([
        {
          id: 'theme-dark',
          label: 'Switch to dark theme',
          keywords: ['appearance'],
          run: () => setTheme('dark'),
        },
        {
          id: 'theme-light',
          label: 'Switch to light theme',
          keywords: ['appearance'],
          run: () => setTheme('light'),
        },
        {
          id: 'preset-glass',
          label: 'Use the glass preset',
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
            { name: 'email', type: 'email', label: 'Email', required: true },
            {
              name: 'plan',
              type: 'select',
              label: 'Plan',
              options: [
                { value: 'free', label: 'Free' },
                { value: 'pro', label: 'Pro' },
              ],
            },
            { name: 'notes', type: 'textarea', label: 'Notes', rows: 3 },
          ],
          { title: 'Create an account' },
        ),
      );
    },

    async wizard() {
      const flow = wizard({
        initialData: { name: '' },
        steps: [
          {
            id: 'profile',
            title: 'Your profile',
            render: (el, ctx) => {
              const input = document.createElement('input');
              input.className = 'fd-input';
              input.placeholder = 'Name';
              input.addEventListener('input', () => ctx.set({ name: input.value }));
              el.append(input);
            },
            validate: (ctx) => (ctx.data.name ? true : 'Please enter your name.'),
          },
          {
            id: 'review',
            title: 'Review',
            render: (el, ctx) => {
              el.textContent = `Ready to welcome ${ctx.data.name}.`;
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
            title: 'Account',
            fields: [{ name: 'email', type: 'email', label: 'Email', required: true }],
          },
          {
            id: 'profile',
            title: 'Profile',
            fields: [{ name: 'name', type: 'text', label: 'Full name', required: true }],
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
