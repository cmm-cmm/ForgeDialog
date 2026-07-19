import { afterEach, describe, expect, it } from 'vitest';
import { wizard } from '../../src/api/wizard';
import type { WizardStep } from '../../src/types';

afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

const twoSteps: WizardStep[] = [
  {
    id: 'account',
    title: 'Account',
    fields: [{ type: 'text', name: 'username', label: 'Username', required: true }],
  },
  {
    id: 'profile',
    title: 'Profile',
    fields: [{ type: 'text', name: 'bio', label: 'Bio' }],
  },
];

function primaryButton(): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>('.fd-btn--primary')!;
}

function secondaryButtons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('.fd-btn--secondary'));
}

describe('wizard()', () => {
  it('throws synchronously when given no steps', () => {
    expect(() => wizard([])).toThrow(/at least one step/);
  });

  it('shows the stepper and only a Cancel + Next button on the first step', () => {
    void wizard(twoSteps);
    expect(document.querySelector('.fd-wizard__stepper')).not.toBeNull();
    expect(secondaryButtons()).toHaveLength(1);
    expect(secondaryButtons()[0].textContent).toBe('Cancel');
    expect(primaryButton().textContent).toBe('Next');
  });

  it('blocks advancing when the current step has an invalid required field', async () => {
    void wizard(twoSteps);
    primaryButton().click();
    await Promise.resolve();
    await Promise.resolve();

    expect(document.querySelector('[name="bio"]')).toBeNull();
    expect(document.querySelector('.fd-field__error')?.textContent).toBe(
      'This field is required.',
    );
  });

  it('advances to the next step, shows Back, and finishes with merged values from every step', async () => {
    const promise = wizard(twoSteps);
    document.querySelector<HTMLInputElement>('[name="username"]')!.value = 'ada';
    primaryButton().click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector('[name="username"]')).toBeNull();
    expect(document.querySelector('[name="bio"]')).not.toBeNull();
    expect(secondaryButtons().map((b) => b.textContent)).toEqual(['Cancel', 'Back']);
    expect(primaryButton().textContent).toBe('Finish');

    document.querySelector<HTMLInputElement>('[name="bio"]')!.value = 'hello there';
    primaryButton().click();

    await expect(promise).resolves.toEqual({ username: 'ada', bio: 'hello there' });
  });

  it('going Back re-renders the previous step with the value preserved', async () => {
    void wizard(twoSteps);
    document.querySelector<HTMLInputElement>('[name="username"]')!.value = 'grace';
    primaryButton().click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    secondaryButtons()
      .find((b) => b.textContent === 'Back')!
      .click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector<HTMLInputElement>('[name="username"]')!.value).toBe('grace');
  });

  it('resolves null when Cancel is clicked on any step', async () => {
    const promise = wizard(twoSteps);
    secondaryButtons()
      .find((b) => b.textContent === 'Cancel')!
      .click();
    await expect(promise).resolves.toBeNull();
  });

  it('resolves null when closed via Escape', async () => {
    const promise = wizard(twoSteps);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await expect(promise).resolves.toBeNull();
  });

  it('supports a custom content() step alongside fields steps', async () => {
    const steps: WizardStep[] = [
      {
        id: 'intro',
        title: 'Welcome',
        content: (container) => {
          const p = document.createElement('p');
          p.textContent = 'Welcome to the wizard.';
          container.appendChild(p);
        },
      },
      {
        id: 'name',
        title: 'Name',
        fields: [{ type: 'text', name: 'name', label: 'Name', required: true }],
      },
    ];
    const promise = wizard(steps);
    expect(document.body.textContent).toContain('Welcome to the wizard.');
    primaryButton().click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    document.querySelector<HTMLInputElement>('[name="name"]')!.value = 'Linus';
    primaryButton().click();

    await expect(promise).resolves.toEqual({ name: 'Linus' });
  });

  it('disables Next/Back while a step transition is in flight, and re-enables after', async () => {
    void wizard(twoSteps);
    document.querySelector<HTMLInputElement>('[name="username"]')!.value = 'ada';
    primaryButton().click();

    // Synchronously right after the click (before the transition's microtasks resolve), the
    // button must already be disabled so a second click can't be silently swallowed.
    expect(primaryButton().disabled).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(primaryButton().disabled).toBe(false);
    const backButton = secondaryButtons().find((b) => b.textContent === 'Back')!;
    expect(backButton.disabled).toBe(false);
  });

  it('runs per-step validate() before allowing advancement', async () => {
    const steps: WizardStep[] = [
      {
        id: 'age',
        title: 'Age',
        fields: [{ type: 'text', name: 'age', label: 'Age' }],
        validate: (stepValues) => (Number(stepValues.age) >= 18 ? true : 'Must be 18+'),
      },
    ];
    const promise = wizard(steps);
    document.querySelector<HTMLInputElement>('[name="age"]')!.value = '10';
    primaryButton().click();
    await Promise.resolve();
    await Promise.resolve();

    expect(document.querySelector('.fd-form__error')?.textContent).toBe('Must be 18+');

    document.querySelector<HTMLInputElement>('[name="age"]')!.value = '25';
    primaryButton().click();

    await expect(promise).resolves.toEqual({ age: '25' });
  });
});
