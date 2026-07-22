import { animateIn, animateOut } from './core/animation';
import { registerAnimationRunners } from './core/animationRegistry';

registerAnimationRunners(animateIn, animateOut);

export { animateIn, animateOut, prefersReducedMotion, runAnimation } from './core/animation';
