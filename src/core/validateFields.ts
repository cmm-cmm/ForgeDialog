import type { DialogLabels, FormFieldConfig, FormFieldValue, FormValues } from '../types';

function isEmptyValue(value: FormFieldValue): boolean {
  if (Array.isArray(value)) return value.length === 0;
  return value === '' || value === undefined || value === null;
}

/**
 * Runs required-field and per-field `validate()` checks for a set of fields against already
 * collected `values`, reporting failures via `setFieldError`. Shared by `form()` and `wizard()`
 * so the two don't duplicate the same validation loop.
 */
export async function validateFields(
  fields: readonly FormFieldConfig[],
  values: FormValues,
  labels: DialogLabels,
  setFieldError: (name: string, message: string) => void,
): Promise<boolean> {
  let hasError = false;

  for (const field of fields) {
    if (field.required && isEmptyValue(values[field.name])) {
      setFieldError(field.name, labels.fieldRequired ?? 'This field is required.');
      hasError = true;
      continue;
    }
    if (!field.validate) continue;
    try {
      const result = await field.validate(values[field.name], values);
      if (result !== true) {
        setFieldError(field.name, typeof result === 'string' ? result : 'Invalid value');
        hasError = true;
      }
    } catch (err) {
      setFieldError(field.name, err instanceof Error ? err.message : 'Invalid value');
      hasError = true;
    }
  }

  return hasError;
}
