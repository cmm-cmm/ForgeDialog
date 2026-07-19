import { buildFormFields } from '../core/formBuilder';
import { validateFields } from '../core/validateFields';
import { getLabels } from '../i18n/defaultLabels';
import type { DialogInstance, FormFieldConfig, FormOptions, InferFormValues } from '../types';
import { generateId } from '../utils/id';
import { open } from './open';

export function form<const F extends readonly FormFieldConfig[]>(
  fields: F,
  options: FormOptions = {},
): Promise<InferFormValues<F> | null> {
  const labels = { ...getLabels(), ...options.labels };
  const formId = generateId('fd-form');
  const ref: { instance?: DialogInstance } = {};
  let built: ReturnType<typeof buildFormFields> | undefined;

  async function submit(instance: DialogInstance): Promise<void> {
    if (!built) return;
    built.clearErrors();

    const values = built.getValues();
    let hasError = await validateFields(fields, values, labels, built.setFieldError);

    if (!hasError && options.validate) {
      try {
        const result = await options.validate(values);
        if (result !== true) {
          built.setFormError(typeof result === 'string' ? result : 'Invalid form');
          hasError = true;
        }
      } catch (err) {
        built.setFormError(err instanceof Error ? err.message : 'Invalid form');
        hasError = true;
      }
    }

    if (hasError) return;
    await instance.close(values);
  }

  const instance = open({
    ...options,
    type: 'form',
    role: 'dialog',
    content: (container) => {
      built = buildFormFields(container, fields, formId);
      container.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && (event.target as HTMLElement).tagName !== 'TEXTAREA') {
          if (ref.instance) {
            event.preventDefault();
            void submit(ref.instance);
          }
        }
      });
    },
    buttons: [
      { text: options.cancelText ?? labels.cancel, role: 'secondary', onClick: (i) => i.close(null) },
      {
        text: options.submitText ?? labels.submit ?? 'Submit',
        role: 'primary',
        onClick: (i) => submit(i),
      },
    ],
  });
  ref.instance = instance;

  return instance
    .whenClosed()
    .then((result) =>
      result === null || result === undefined ? null : (result as InferFormValues<F>),
    );
}
