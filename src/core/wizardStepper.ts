import { prefersReducedMotion, runAnimation } from './animation';

export type StepState = 'completed' | 'current' | 'upcoming';

export interface WizardStepperHandle {
  /** Where the current step's content should be rendered into. */
  viewport: HTMLDivElement;
  /** Updates marker/connector states for the given active index. */
  setActiveIndex(index: number): void;
  /**
   * Mounts a freshly-rendered step panel into the viewport, animating the outgoing panel out
   * and the incoming one in along `direction`. Resolves once the transition finishes.
   */
  transitionTo(render: (panel: HTMLElement) => void, direction: 'forward' | 'back'): Promise<void>;
}

function buildMarker(index: number): HTMLDivElement {
  const marker = document.createElement('div');
  marker.className = 'fd-wizard__marker';
  marker.textContent = String(index + 1);
  return marker;
}

export function buildWizardStepper(root: HTMLElement, stepTitles: (string | undefined)[]): WizardStepperHandle {
  const wizard = document.createElement('div');
  wizard.className = 'fd-wizard';

  const stepper = document.createElement('div');
  stepper.className = 'fd-wizard__stepper';
  stepper.setAttribute('role', 'list');

  const markers: HTMLDivElement[] = [];
  const connectors: HTMLDivElement[] = [];

  stepTitles.forEach((title, index) => {
    const step = document.createElement('div');
    step.className = 'fd-wizard__step';
    step.setAttribute('role', 'listitem');

    const marker = buildMarker(index);
    step.appendChild(marker);
    markers.push(marker);

    if (title) {
      const label = document.createElement('span');
      label.className = 'fd-wizard__step-label';
      label.textContent = title;
      step.appendChild(label);
    }

    stepper.appendChild(step);

    if (index < stepTitles.length - 1) {
      const connector = document.createElement('div');
      connector.className = 'fd-wizard__connector';
      stepper.appendChild(connector);
      connectors.push(connector);
    }
  });

  const viewport = document.createElement('div');
  viewport.className = 'fd-wizard__viewport';

  let currentPanel = document.createElement('div');
  currentPanel.className = 'fd-wizard__panel';
  viewport.appendChild(currentPanel);

  wizard.appendChild(stepper);
  wizard.appendChild(viewport);
  root.appendChild(wizard);

  function setActiveIndex(index: number): void {
    markers.forEach((marker, i) => {
      const state: StepState = i < index ? 'completed' : i === index ? 'current' : 'upcoming';
      marker.dataset.state = state;
      marker.textContent = state === 'completed' ? '✓' : String(i + 1);
      marker.parentElement?.setAttribute('data-state', state);
    });
    connectors.forEach((connector, i) => {
      connector.dataset.state = i < index ? 'completed' : 'upcoming';
    });
  }

  async function transitionTo(
    render: (panel: HTMLElement) => void,
    direction: 'forward' | 'back',
  ): Promise<void> {
    const outgoing = currentPanel;
    const incoming = document.createElement('div');
    incoming.className = 'fd-wizard__panel';
    render(incoming);

    const outSign = direction === 'forward' ? -1 : 1;
    const inSign = -outSign;

    if (prefersReducedMotion()) {
      outgoing.replaceWith(incoming);
      currentPanel = incoming;
      return;
    }

    incoming.style.position = 'absolute';
    incoming.style.inset = '0';
    incoming.style.opacity = '0';
    viewport.style.position = 'relative';
    viewport.appendChild(incoming);

    await Promise.all([
      runAnimation(
        outgoing,
        [
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: `translateX(${outSign * 24}px)` },
        ],
        180,
      ),
      runAnimation(
        incoming,
        [
          { opacity: 0, transform: `translateX(${inSign * 24}px)` },
          { opacity: 1, transform: 'translateX(0)' },
        ],
        220,
      ),
    ]);

    incoming.style.position = '';
    incoming.style.inset = '';
    incoming.style.opacity = '';
    outgoing.remove();
    currentPanel = incoming;
  }

  setActiveIndex(0);

  return { viewport, setActiveIndex, transitionTo };
}
