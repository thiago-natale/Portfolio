import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { CustomEase } from 'gsap/CustomEase';
import { PRELOADER_RELEASE_EVENT, preloaderPending } from './preloader-events';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, DrawSVGPlugin, MotionPathPlugin, MorphSVGPlugin, CustomEase);
CustomEase.create('editorial-open', '.19,1,.22,1');
CustomEase.create('editorial-settle', '.25,.1,.25,1');
CustomEase.create('editorial-response', '.2,.7,.3,1');

export { gsap, ScrollTrigger, ScrollSmoother, SplitText };
export const motion = {
  ease: { open: 'editorial-open', settle: 'editorial-settle', response: 'editorial-response' },
  desktop: '(min-width: 1024px)',
  mobile: '(max-width: 599px)',
  reduce: '(prefers-reduced-motion: reduce)',
  scrub: .5,
  pinDistance: .65,
  scroll: { desktop: .85, mobile: .6, touch: .1 },
};
export type Timeline = gsap.core.Timeline;
export interface MotionScope {
  mobile: boolean;
  desktop: boolean;
  completed: Set<string>;
  navigationRevealed: Set<string>;
  timelines: Map<string, Timeline>;
  targets: Map<string, Element>;
  scrubs: Map<string, { hold: () => void; resume: () => void }>;
  cleanups: Array<() => void>;
}

export function remember(scope: MotionScope, id: string, timeline: Timeline, target?: Element, playback: 'entrance' | 'scroll' = 'entrance') {
  scope.timelines.set(id, timeline);
  if (target) scope.targets.set(id, target);
  if (playback === 'entrance') timeline.eventCallback('onComplete', () => scope.completed.add(id));
  return timeline;
}

export function revealedByNavigation(scope: MotionScope, element: Element) {
  const id = element.closest('section')?.id;
  return !!id && scope.navigationRevealed.has(id);
}

/** Keep the scroll driver separate from a section explicitly opened by navigation. */
export function scrubTimeline(scope: MotionScope, element: HTMLElement, timeline: Timeline, vars: ScrollTrigger.Vars, ready = () => true) {
  timeline.pause();
  const playhead = { progress: 0 };
  const override = { weight: revealedByNavigation(scope, element) ? 1 : 0 };
  const apply = () => {
    if (revealedByNavigation(scope, element)) timeline.progress(1).pause();
    else {
      const progress = ready() ? playhead.progress : 0;
      timeline.progress(progress + (1 - progress) * override.weight).pause();
    }
  };
  // Prepared inside matchMedia; replaying it later does not create orphan tweens.
  const handoff = gsap.to(override, { weight: 0, duration: .22, ease: motion.ease.response, paused: true, onUpdate: apply });
  scope.scrubs.set(vars.id!, {
    hold: () => { handoff.pause(); override.weight = 1; timeline.progress(1).pause(); },
    resume: () => { if (override.weight > 0) handoff.restart(); else apply(); },
  });
  const driver = gsap.to(playhead, { progress: 1, duration: 1, ease: 'none', paused: true, onUpdate: apply });
  const synchronize = (trigger: ScrollTrigger) => {
    // Refresh can revert a proxy tween while preparing another section. Restore
    // its geometric progress explicitly, including sections already crossed.
    playhead.progress = trigger.progress;
    apply();
  };
  const trigger = ScrollTrigger.create({
    ...vars, trigger: element, animation: driver,
    onRefresh: self => { synchronize(self); vars.onRefresh?.(self); },
    onLeave: self => { synchronize(self); vars.onLeave?.(self); },
    onLeaveBack: self => { synchronize(self); vars.onLeaveBack?.(self); },
  });
  // Preserve the visible timeline's trigger association for diagnostics and focus.
  timeline.scrollTrigger = trigger;
  apply();
  return { trigger, apply };
}

/** One-shot section entrances remain complete when traversed quickly or revisited. */
export function enter(scope: MotionScope, id: string, element: Element, timeline: Timeline) {
  remember(scope, id, timeline, element);
  if (preloaderPending()) {
    timeline.pause();
    const activate = () => enter(scope, id, element, timeline);
    window.addEventListener(PRELOADER_RELEASE_EVENT, activate, { once: true });
    scope.cleanups.push(() => window.removeEventListener(PRELOADER_RELEASE_EVENT, activate));
    return;
  }
  if (revealedByNavigation(scope, element) || scope.completed.has(id) || element.getBoundingClientRect().bottom < 0) {
    timeline.progress(1).pause();
    return;
  }
  ScrollTrigger.create({
    id, trigger: element, animation: timeline,
    start: 'clamp(top 88%)', end: 'clamp(bottom top)',
    toggleActions: 'play none none none',
    onLeave: () => timeline.progress(1).pause(),
  });
  if (element.getBoundingClientRect().top < innerHeight * .88) timeline.play();
}

/** SplitText rebuilds its own child tween when line breaks change. */
export function revealText(scope: MotionScope, timeline: Timeline, target: Element | null, at: number, vars: gsap.TweenVars = {}) {
  if (!target) return;
  const split = SplitText.create(target, {
    // The line's clip-path is the reveal mask. A second overflow-clipped wrapper
    // would cut Anton's accents and cedillas outside the compact line box.
    type: 'lines', autoSplit: true, aria: 'none',
    linesClass: 'motion-line',
    onSplit(self) {
      // Responsive elements hidden at this breakpoint have no lines to animate.
      if (!self.lines.length) return;
      gsap.set(self.lines, { clipPath: 'inset(-.22em 0% -.22em 0%)' });
      const tween = gsap.from(self.lines, {
        clipPath: 'inset(-.22em 100% -.22em 0%)', duration: .5, stagger: .045,
        ease: motion.ease.open, ...vars,
        clearProps: 'clipPath',
      });
      timeline.add(tween, at);
      return tween;
    },
  });
  scope.cleanups.push(() => split.revert());
}

/** Existing multi-subpath icons are separated before drawing their strokes. */
export function iconStrokes(root: Element) {
  root.querySelectorAll<SVGPathElement>('path:not([data-stroke-part])').forEach((path) => {
    const parts = path.getAttribute('d')?.match(/[Mm][^Mm]*/g);
    if (!parts || parts.length < 2) return;
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    parts.forEach((d) => {
      const part = path.cloneNode() as SVGPathElement;
      part.setAttribute('d', d);
      part.dataset.strokePart = '';
      group.append(part);
    });
    path.replaceWith(group);
  });
  return root.querySelectorAll('path');
}
