import { afterEach, describe, expect, it, vi } from 'vitest';
import { wizard } from '../../src/workflow/wizard';

afterEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
});

describe('wizard()', () => {
  it('shares typed data and completes a multi-step workflow', async () => {
    const complete = vi.fn();
    const controller = wizard({
      initialData: { name: '' },
      onComplete: complete,
      steps: [
        {
          id: 'name',
          title: 'Name',
          render: (container, context) => {
            context.set({ name: 'Ada' });
            container.textContent = 'Name step';
          },
        },
        {
          id: 'review',
          title: 'Review',
          render: (container) => (container.textContent = 'Review'),
        },
      ],
    });
    await vi.waitFor(() => expect(document.body.textContent).toContain('Name step'));
    await controller.next();
    await controller.next();
    await expect(controller.result).resolves.toEqual({ name: 'Ada' });
    expect(complete).toHaveBeenCalledWith({ name: 'Ada' });
  });

  it('supports branching and persisted drafts', async () => {
    localStorage.setItem('draft', JSON.stringify({ plan: 'pro' }));
    const controller = wizard({
      persistKey: 'draft',
      initialData: { plan: 'free' },
      steps: [
        { id: 'choose', title: 'Choose', render: () => {}, next: (data) => data.plan },
        { id: 'free', title: 'Free', render: () => {} },
        { id: 'pro', title: 'Pro', render: () => {} },
      ],
    });
    expect(controller.getData()).toEqual({ plan: 'pro' });
    await controller.next();
    expect(document.body.textContent).toContain('Pro');
    await controller.instance.destroy();
  });

  it('blocks invalid steps and supports direct navigation and back', async () => {
    const controller = wizard({
      initialData: { accepted: false },
      steps: [
        { id: 'one', title: 'One', render: () => {}, validate: () => 'Accept first' },
        { id: 'two', title: 'Two', render: () => {} },
      ],
    });
    await controller.next();
    expect(document.body.textContent).toContain('Accept first');
    await controller.goTo('two');
    expect(document.body.textContent).toContain('Two');
    await controller.back();
    expect(document.body.textContent).toContain('One');
    await expect(controller.goTo('missing')).rejects.toThrow('Unknown wizard step');
    await controller.instance.destroy();
  });

  it('rejects empty and duplicate step definitions', () => {
    expect(() => wizard({ initialData: {}, steps: [] })).toThrow('at least one step');
    expect(() =>
      wizard({
        initialData: {},
        steps: [
          { id: 'same', title: 'A', render: () => {} },
          { id: 'same', title: 'B', render: () => {} },
        ],
      }),
    ).toThrow('unique');
  });
});
