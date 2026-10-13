import { ScrollTrigger, motion, remember, revealedByNavigation, scrubTimeline, type MotionScope, type Timeline } from '../../../scripts/motion-config';
import { PRELOADER_RELEASE_EVENT, preloaderPending } from '../../../scripts/preloader-events';
import { visualScroll } from '../../../scripts/navigation';
import type { JourneyTransition } from '../ProfessionalJourney/journey-transition';

/** Prepare every trigger synchronously so matchMedia owns its full lifecycle. */
export function enterAfterJourney(scope: MotionScope, transition: JourneyTransition, id: string, element: Element, timeline: Timeline) {
  remember(scope, id, timeline, element).pause();
  const activate = () => {
    if (preloaderPending() || !transition.released && !revealedByNavigation(scope, element)) return;
    if (revealedByNavigation(scope, element) || scope.completed.has(id) || element.getBoundingClientRect().bottom <= 0) timeline.progress(1).pause();
    else if (element.getBoundingClientRect().top < innerHeight * .88) timeline.play();
  };
  ScrollTrigger.create({
    id, trigger: element, animation: timeline,
    start: 'clamp(top 88%)', end: 'clamp(bottom top)',
    toggleActions: 'none none none none',
    onEnter: activate, onEnterBack: activate,
    onLeave: () => { if (transition.released) timeline.progress(1).pause(); },
  });
  scope.cleanups.push(transition.subscribe(activate));
  window.addEventListener(PRELOADER_RELEASE_EVENT, activate);
  scope.cleanups.push(() => window.removeEventListener(PRELOADER_RELEASE_EVENT, activate));
}

/** Scroll advances a proxy while the real process waits for the line to arrive. */
export function scrubAfterJourney(scope: MotionScope, transition: JourneyTransition, element: HTMLElement, timeline: Timeline) {
  remember(scope, 'process', timeline, element, 'scroll').pause();
  const { apply } = scrubTimeline(scope, element, timeline, {
    id: 'process',
    start: () => `clamp(${Math.max(element.getBoundingClientRect().top + visualScroll() - innerHeight * .78, transition.startPosition())})`,
    end: 'clamp(bottom 42%)', scrub: motion.scrub,
  }, () => transition.released && !preloaderPending());
  scope.cleanups.push(transition.subscribe(apply));
  window.addEventListener(PRELOADER_RELEASE_EVENT, apply);
  scope.cleanups.push(() => window.removeEventListener(PRELOADER_RELEASE_EVENT, apply));
}
