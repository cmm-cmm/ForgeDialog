import { describe, expect, it, vi } from 'vitest';
import { validateFields } from '../../src/core/validateFields';
import type { FormFieldConfig } from '../../src/types';

const labels = { ok: 'OK', cancel: 'Cancel', close: 'Close', fieldRequired: 'Required.' };

describe('validateFields', () => {
  it('reports no error when all fields are valid', async () => {
    const fields: FormFieldConfig[] = [{ type: 'text', name: 'a', required: true }];
    const setFieldError = vi.fn();
    const hasError = await validateFields(fields, { a: 'x' }, labels, setFieldError);
    expect(hasError).toBe(false);
    expect(setFieldError).not.toHaveBeenCalled();
  });

  it('flags an empty required field without calling validate()', async () => {
    const validate = vi.fn().mockReturnValue(true);
    const fields: FormFieldConfig[] = [{ type: 'text', name: 'a', required: true, validate }];
    const setFieldError = vi.fn();
    const hasError = await validateFields(fields, { a: '' }, labels, setFieldError);
    expect(hasError).toBe(true);
    expect(setFieldError).toHaveBeenCalledWith('a', 'Required.');
    expect(validate).not.toHaveBeenCalled();
  });

  it('treats an empty array value (e.g. no files selected) as empty for required checks', async () => {
    const fields: FormFieldConfig[] = [{ type: 'file', name: 'docs', required: true }];
    const setFieldError = vi.fn();
    const hasError = await validateFields(fields, { docs: [] }, labels, setFieldError);
    expect(hasError).toBe(true);
    expect(setFieldError).toHaveBeenCalledWith('docs', 'Required.');
  });

  it('runs validate() and reports its string message on failure', async () => {
    const fields: FormFieldConfig[] = [
      { type: 'text', name: 'age', validate: (v) => (Number(v) >= 18 ? true : 'Too young') },
    ];
    const setFieldError = vi.fn();
    const hasError = await validateFields(fields, { age: '10' }, labels, setFieldError);
    expect(hasError).toBe(true);
    expect(setFieldError).toHaveBeenCalledWith('age', 'Too young');
  });

  it('reports a generic message when validate() returns false without a string', async () => {
    const fields: FormFieldConfig[] = [{ type: 'text', name: 'a', validate: () => false }];
    const setFieldError = vi.fn();
    await validateFields(fields, { a: 'x' }, labels, setFieldError);
    expect(setFieldError).toHaveBeenCalledWith('a', 'Invalid value');
  });

  it('catches a throwing/rejecting validate() and reports its message', async () => {
    const fields: FormFieldConfig[] = [
      {
        type: 'text',
        name: 'a',
        validate: () => {
          throw new Error('boom');
        },
      },
    ];
    const setFieldError = vi.fn();
    const hasError = await validateFields(fields, { a: 'x' }, labels, setFieldError);
    expect(hasError).toBe(true);
    expect(setFieldError).toHaveBeenCalledWith('a', 'boom');
  });
});
