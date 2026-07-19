import { afterEach, describe, expect, it } from 'vitest';
import { form } from '../../src/api/form';
import type { FormFieldConfig } from '../../src/types';

afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

const basicFields: FormFieldConfig[] = [
  { type: 'text', name: 'username', label: 'Username', required: true },
  { type: 'email', name: 'email', label: 'Email' },
];

describe('form()', () => {
  it('resolves with the collected values when submitted', async () => {
    const promise = form(basicFields);
    const username = document.querySelector<HTMLInputElement>('[name="username"]')!;
    const email = document.querySelector<HTMLInputElement>('[name="email"]')!;
    username.value = 'ada';
    email.value = 'ada@example.com';
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();

    await expect(promise).resolves.toEqual({ username: 'ada', email: 'ada@example.com' });
  });

  it('resolves null when Cancel is clicked', async () => {
    const promise = form(basicFields);
    document.querySelector<HTMLButtonElement>('.fd-btn--secondary')!.click();
    await expect(promise).resolves.toBeNull();
  });

  it('blocks submit and shows an error when a required field is empty', async () => {
    const promise = form(basicFields);
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
    await Promise.resolve();
    await Promise.resolve();

    const error = document.querySelector('[data-fd-field="username"] .fd-field__error');
    expect(error?.textContent).toBe('This field is required.');

    document.querySelector<HTMLInputElement>('[name="username"]')!.value = 'grace';
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
    await expect(promise).resolves.toEqual({ username: 'grace', email: '' });
  });

  it('runs per-field validate() and shows the returned message on failure', async () => {
    const fields: FormFieldConfig[] = [
      {
        type: 'text',
        name: 'age',
        label: 'Age',
        validate: (value) => (Number(value) >= 18 ? true : 'Must be 18 or older'),
      },
    ];
    const promise = form(fields);
    document.querySelector<HTMLInputElement>('[name="age"]')!.value = '10';
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(document.querySelector('.fd-field__error')?.textContent).toBe('Must be 18 or older');

    document.querySelector<HTMLInputElement>('[name="age"]')!.value = '21';
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
    await expect(promise).resolves.toEqual({ age: '21' });
  });

  it('runs whole-form validate() for cross-field rules', async () => {
    const fields: FormFieldConfig[] = [
      { type: 'password', name: 'password', label: 'Password' },
      { type: 'password', name: 'confirm', label: 'Confirm' },
    ];
    const promise = form(fields, {
      validate: (values) => (values.password === values.confirm ? true : 'Passwords must match'),
    });
    document.querySelector<HTMLInputElement>('[name="password"]')!.value = 'a';
    document.querySelector<HTMLInputElement>('[name="confirm"]')!.value = 'b';
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(document.querySelector('.fd-form__error')?.textContent).toBe('Passwords must match');

    document.querySelector<HTMLInputElement>('[name="confirm"]')!.value = 'a';
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
    await expect(promise).resolves.toEqual({ password: 'a', confirm: 'a' });
  });

  it('collects checkbox, radio, select, and number field values correctly', async () => {
    const fields: FormFieldConfig[] = [
      { type: 'checkbox', name: 'subscribe', label: 'Subscribe', defaultValue: true },
      {
        type: 'radio',
        name: 'plan',
        label: 'Plan',
        options: [
          { label: 'Free', value: 'free' },
          { label: 'Pro', value: 'pro' },
        ],
        defaultValue: 'pro',
      },
      {
        type: 'select',
        name: 'country',
        label: 'Country',
        options: [
          { label: 'VN', value: 'vn' },
          { label: 'US', value: 'us' },
        ],
        defaultValue: 'us',
      },
      { type: 'number', name: 'age', label: 'Age', defaultValue: 30 },
    ];
    const promise = form(fields);
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();

    await expect(promise).resolves.toEqual({
      subscribe: true,
      plan: 'pro',
      country: 'us',
      age: 30,
    });
  });

  it('resolves null when closed via Escape', async () => {
    const promise = form(basicFields);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await expect(promise).resolves.toBeNull();
  });

  it('collects multiple selected options for a multi-select field', async () => {
    const fields: FormFieldConfig[] = [
      {
        type: 'select',
        name: 'tags',
        label: 'Tags',
        multiple: true,
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
          { label: 'C', value: 'c' },
        ],
      },
    ];
    const promise = form(fields);
    const select = document.querySelector<HTMLSelectElement>('[name="tags"]')!;
    select.options[0].selected = true;
    select.options[2].selected = true;
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
    await expect(promise).resolves.toEqual({ tags: ['a', 'c'] });
  });

  describe('file field', () => {
    function makeFile(name: string, sizeBytes: number, type = 'text/plain'): File {
      return new File([new Uint8Array(sizeBytes)], name, { type });
    }

    it('adds files via the hidden input change event and collects them as File[]', async () => {
      const fields: FormFieldConfig[] = [
        { type: 'file', name: 'docs', label: 'Documents', multiple: true },
      ];
      const promise = form(fields);
      const input = document.querySelector<HTMLInputElement>('.fd-dropzone__input')!;
      const file = makeFile('a.txt', 10);
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change'));

      expect(document.querySelector('.fd-dropzone__filename')?.textContent).toContain('a.txt');

      document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
      const result = (await promise) as unknown as { docs: File[] };
      expect(result.docs).toHaveLength(1);
      expect(result.docs[0].name).toBe('a.txt');
    });

    it('adds files via a drop event on the dropzone', async () => {
      const fields: FormFieldConfig[] = [{ type: 'file', name: 'docs', label: 'Documents' }];
      const promise = form(fields);
      const dropzone = document.querySelector<HTMLDivElement>('.fd-dropzone')!;
      const file = makeFile('dropped.png', 20, 'image/png');
      dropzone.dispatchEvent(
        new DragEvent('drop', { dataTransfer: { files: [file] } as unknown as DataTransfer }),
      );

      expect(document.querySelector('.fd-dropzone__filename')?.textContent).toContain(
        'dropped.png',
      );
      expect(document.querySelector('.fd-dropzone__thumb')).not.toBeNull();

      document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
      const result = (await promise) as unknown as { docs: File[] };
      expect(result.docs[0].name).toBe('dropped.png');
    });

    it('removes a file when its remove button is clicked', async () => {
      const fields: FormFieldConfig[] = [
        { type: 'file', name: 'docs', label: 'Documents', multiple: true },
      ];
      const promise = form(fields);
      const input = document.querySelector<HTMLInputElement>('.fd-dropzone__input')!;
      Object.defineProperty(input, 'files', { value: [makeFile('keep.txt', 5)], configurable: true });
      input.dispatchEvent(new Event('change'));
      Object.defineProperty(input, 'files', { value: [makeFile('drop.txt', 5)], configurable: true });
      input.dispatchEvent(new Event('change'));

      expect(document.querySelectorAll('.fd-dropzone__item')).toHaveLength(2);
      const removeButtons = document.querySelectorAll<HTMLButtonElement>('.fd-dropzone__remove');
      removeButtons[0].click();
      expect(document.querySelectorAll('.fd-dropzone__item')).toHaveLength(1);
      expect(document.querySelector('.fd-dropzone__filename')?.textContent).toContain('drop.txt');

      document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
      const result = (await promise) as unknown as { docs: File[] };
      expect(result.docs.map((f) => f.name)).toEqual(['drop.txt']);
    });

    it('rejects files larger than maxSizeBytes', async () => {
      const fields: FormFieldConfig[] = [
        { type: 'file', name: 'docs', label: 'Documents', maxSizeBytes: 100 },
      ];
      void form(fields);
      const input = document.querySelector<HTMLInputElement>('.fd-dropzone__input')!;
      Object.defineProperty(input, 'files', {
        value: [makeFile('too-big.txt', 500)],
        configurable: true,
      });
      input.dispatchEvent(new Event('change'));

      expect(document.querySelectorAll('.fd-dropzone__item')).toHaveLength(0);
      expect(document.querySelector('.fd-field__error')?.textContent).toContain('smaller');
    });

    it('blocks submit when a required file field has no files', async () => {
      const fields: FormFieldConfig[] = [
        { type: 'file', name: 'docs', label: 'Documents', required: true },
      ];
      void form(fields);
      document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
      await Promise.resolve();
      await Promise.resolve();

      expect(document.querySelector('.fd-field__error')?.textContent).toBe(
        'This field is required.',
      );
    });
  });
});
