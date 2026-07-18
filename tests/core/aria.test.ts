import { describe, expect, it } from 'vitest';
import { fallbackTitleForType, resolveRole } from '../../src/core/aria';

describe('aria helpers', () => {
  it('resolves alertdialog role for alert/confirm', () => {
    expect(resolveRole('alert')).toBe('alertdialog');
    expect(resolveRole('confirm')).toBe('alertdialog');
  });

  it('resolves dialog role for prompt/custom', () => {
    expect(resolveRole('prompt')).toBe('dialog');
    expect(resolveRole('custom')).toBe('dialog');
  });

  it('respects an explicit role override', () => {
    expect(resolveRole('custom', 'alertdialog')).toBe('alertdialog');
  });

  it('provides sensible fallback titles per type', () => {
    expect(fallbackTitleForType('alert')).toBe('Alert');
    expect(fallbackTitleForType('confirm')).toBe('Confirm');
    expect(fallbackTitleForType('prompt')).toBe('Prompt');
    expect(fallbackTitleForType('custom')).toBe('Dialog');
  });
});
