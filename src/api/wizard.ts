import { buildFormFields, type BuiltForm } from '../core/formBuilder';
import { validateFields } from '../core/validateFields';
import { buildWizardStepper, type WizardStepperHandle } from '../core/wizardStepper';
import { getLabels } from '../i18n/defaultLabels';
import type {
  ButtonConfig,
  DialogInstance,
  FormFieldConfig,
  FormValues,
  InferWizardValues,
  FormWizardOptions,
  FormWizardStep,
} from '../types';
import { generateId } from '../utils/id';
import { open } from './open';

export function wizard<const S extends readonly FormWizardStep[]>(
  steps: S,
  options: FormWizardOptions = {},
): Promise<InferWizardValues<S> | null> {
  if (steps.length === 0) {
    throw new Error('wizard() requires at least one step');
  }

  const labels = { ...getLabels(), ...options.labels };
  const wizardId = generateId('fd-wizard');
  const collected: FormValues = {};
  let stepperHandle: WizardStepperHandle | undefined;
  let currentBuilt: BuiltForm | undefined;
  let index = 0;
  let busy = false;

  function fieldsWithDefaults(step: FormWizardStep): FormFieldConfig[] {
    return (step.fields ?? []).map((field) =>
      field.name in collected ? { ...field, defaultValue: collected[field.name] } : field,
    );
  }

  function renderStep(panel: HTMLElement): void {
    const step = steps[index];
    if (step.fields && step.fields.length > 0) {
      currentBuilt = buildFormFields(panel, fieldsWithDefaults(step), `${wizardId}-${index}`);
    } else {
      currentBuilt = undefined;
      step.content?.(panel, { ...collected });
    }
  }

  // Disabled while `busy`, so a click mid-transition is visibly rejected instead of silently
  // dropped by the `busy` guard in goNext/goBack.
  function computeButtons(): ButtonConfig<FormValues | null>[] {
    const isFirst = index === 0;
    const isLast = index === steps.length - 1;
    const buttons: ButtonConfig<FormValues | null>[] = [
      {
        text: options.cancelText ?? labels.cancel,
        role: 'secondary',
        disabled: busy,
        onClick: (i) => i.close(null),
      },
    ];
    if (!isFirst) {
      buttons.push({
        text: options.backText ?? 'Back',
        role: 'secondary',
        disabled: busy,
        onClick: (i) => void goBack(i),
      });
    }
    buttons.push({
      text: isLast ? (options.finishText ?? 'Finish') : (options.nextText ?? 'Next'),
      role: 'primary',
      autoFocus: true,
      disabled: busy,
      onClick: (i) => void goNext(i),
    });
    return buttons;
  }

  function syncChrome(instance: DialogInstance<FormValues | null>): void {
    stepperHandle?.setActiveIndex(index);
    instance.update({ buttons: computeButtons(), title: steps[index].title ?? options.title });
  }

  async function goNext(instance: DialogInstance<FormValues | null>): Promise<void> {
    if (busy) return;
    busy = true;
    instance.update({ buttons: computeButtons() });
    try {
      const step = steps[index];
      if (step.fields && step.fields.length > 0 && currentBuilt) {
        currentBuilt.clearErrors();
        const stepValues = currentBuilt.getValues();
        const hasFieldErrors = await validateFields(
          step.fields,
          stepValues,
          labels,
          currentBuilt.setFieldError,
        );
        if (hasFieldErrors) return;

        if (step.validate) {
          try {
            const result = await step.validate(stepValues, { ...collected, ...stepValues });
            if (result !== true) {
              currentBuilt.setFormError(typeof result === 'string' ? result : 'Invalid step');
              return;
            }
          } catch (err) {
            currentBuilt.setFormError(err instanceof Error ? err.message : 'Invalid step');
            return;
          }
        }

        Object.assign(collected, stepValues);
      }

      if (index === steps.length - 1) {
        await instance.close({ ...collected });
        return;
      }

      index += 1;
      await stepperHandle?.transitionTo(renderStep, 'forward');
      options.onStepChange?.(index, steps[index]);
    } finally {
      busy = false;
      syncChrome(instance);
    }
  }

  async function goBack(instance: DialogInstance<FormValues | null>): Promise<void> {
    if (busy || index === 0) return;
    busy = true;
    instance.update({ buttons: computeButtons() });
    try {
      index -= 1;
      await stepperHandle?.transitionTo(renderStep, 'back');
      options.onStepChange?.(index, steps[index]);
    } finally {
      busy = false;
      syncChrome(instance);
    }
  }

  const instance = open({
    ...options,
    type: 'wizard',
    role: 'dialog',
    title: steps[0].title ?? options.title,
    content: (container) => {
      stepperHandle = buildWizardStepper(
        container,
        steps.map((step) => step.title),
      );
      renderStep(stepperHandle.viewport.firstElementChild as HTMLElement);
    },
    buttons: computeButtons(),
  });

  return instance
    .whenClosed()
    .then((result) =>
      result === null || result === undefined ? null : (result as InferWizardValues<S>),
    );
}
