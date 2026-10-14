import { gsap, ScrollTrigger, ScrollSmoother, motion, remember, enter, revealText, scrubTimeline, type MotionScope, type Timeline } from '../../../scripts/motion-config';
import type { JourneyTransition } from './journey-transition';

/** Measure in local coordinates: the smoother's shared transform cancels out. */
export function measureJourneyRoute(root: HTMLElement) {
  const nodes = [...root.querySelectorAll<SVGSVGElement>('.career-entry__milestone')];
  const route = root.querySelector<SVGSVGElement>('.career-entry__route')!;
  const track = route.parentElement!;
  const lastEntry = root.querySelector<HTMLElement>('.career-entry:last-child')!;
  const first = nodes[0].getBoundingClientRect(), last = nodes[1].getBoundingClientRect();
  const trackBox = track.getBoundingClientRect(), routeBox = route.getBoundingClientRect();
  const start = first.top + first.height / 2;
  const bridgeHeight = last.top + last.height / 2 - start;
  // Continue through the last job, including whichever column defines its height.
  const height = lastEntry.getBoundingClientRect().bottom - parseFloat(getComputedStyle(lastEntry).paddingBottom) - start;
  const x = first.left + first.width / 2 - routeBox.left;
  const bend = Math.min(6, routeBox.width / 5);
  const contents = [...root.querySelectorAll<HTMLElement>('.career-entry__content')];
  const middle = (index: number, min: number, max: number) => {
    const box = contents[index].getBoundingClientRect();
    return gsap.utils.clamp(min + bend * 3, max - bend * 3, box.top + box.height / 2 - start);
  };
  const detour = (center: number) => `V${center - bend * 2}L${x + bend} ${center - bend}V${center + bend}L${x} ${center + bend * 2}`;
  const bridge = `M${x} 0${detour(middle(0, 0, bridgeHeight))}V${bridgeHeight}`;
  const d = `${bridge}${detour(middle(1, bridgeHeight, height))}V${height}`;
  const originalStyle = route.getAttribute('style');
  const originalBox = route.getAttribute('viewBox')!;
  const paths = [...route.querySelectorAll<SVGPathElement>('path')];
  const originalPaths = paths.map(path => path.getAttribute('d')!);
  route.style.top = `${start - trackBox.top}px`;
  route.style.height = `${height}px`;
  route.setAttribute('viewBox', `0 0 ${routeBox.width} ${height}`);
  // Measure the prefix before adding the second detour: vertical distance alone
  // no longer identifies the second company stop on the completed path.
  paths[1].setAttribute('d', bridge);
  const bridgeLength = paths[1].getTotalLength();
  paths.forEach(path => path.setAttribute('d', d));
  const restore = () => {
    if (originalStyle === null) route.removeAttribute('style'); else route.setAttribute('style', originalStyle);
    route.setAttribute('viewBox', originalBox);
    paths.forEach((path, index) => path.setAttribute('d', originalPaths[index]));
  };
  const length = paths[1].getTotalLength();
  const destinationProgress = bridgeLength / length;
  return { route: paths[1], destinationProgress, restore, signal: route.querySelector<SVGRectElement>('.career-entry__signal')! };
}

export function animateProfessionalJourney(root: HTMLElement, scope: MotionScope, transition: JourneyTransition) {
  const head = gsap.timeline({ defaults: { ease: motion.ease.open } });
  head.from(root.querySelector('.professional-journey__rule'), { scaleX: 0, transformOrigin: 'left', duration: .5 });
  revealText(scope, head, root.querySelector('h2'), 0, { duration: .5 });
  enter(scope, 'journey-heading', root.querySelector('header')!, head);

  const entries = [...root.querySelectorAll<HTMLElement>('.career-entry')];
  const nodes = entries.map(entry => entry.querySelector('.career-entry__node')!);
  const cores = entries.map(entry => entry.querySelector('.career-entry__core')!);
  const outcomes = entries.map(entry => entry.querySelector('.career-entry__outcome')!);
  const mobileIds = entries.map(entry => `journey-${entry.dataset.experience}`);
  // Only the finite mobile entrances retain completion. Desktop always follows scroll.
  const completed = mobileIds.every(id => scope.completed.has(id));
  const { route, signal, destinationProgress, restore } = measureJourneyRoute(root);
  scope.cleanups.push(restore);
  const colors = getComputedStyle(root);
  const accent = colors.getPropertyValue('--color-accent-text').trim();
  const muted = colors.getPropertyValue('--color-muted').trim();
  // Synchronous initialization avoids a painted full stroke followed by reset.
  gsap.set([...nodes, route], { drawSVG: 0 });
  gsap.set(cores, { opacity: .15 });
  gsap.set(outcomes, { color: muted });
  gsap.set(signal, { autoAlpha: 0 });

  const base = () => gsap.timeline({ defaults: { ease: motion.ease.settle } })
    .addLabel('estrutura')
    .to(nodes[0], { drawSVG: '100%', duration: .35 })
    .addLabel('base', .2)
    .to(cores[0], { opacity: 1, duration: .2 }, 'base')
    .to(outcomes[0], { color: accent, duration: .25 }, 'base');
  const bridge = () => gsap.timeline()
    .addLabel('ponte')
    .set(signal, { autoAlpha: 1 })
    .to(route, { drawSVG: `${destinationProgress * 100}%`, duration: .85, ease: 'none' }, 0)
    .to(signal, { motionPath: { path: route, align: route, alignOrigin: [.5, .5], autoRotate: false, end: destinationProgress }, duration: .85, ease: 'none' }, 0);
  const destination = () => gsap.timeline({ defaults: { ease: motion.ease.settle } })
    .addLabel('aplicacao')
    .to(nodes[1], { drawSVG: '100%', duration: .35 })
    .to(cores[1], { opacity: 1, duration: .2 }, .15)
    .to(outcomes[1], { color: accent, duration: .25 }, .15)
    .addLabel('continuidade', .35)
    .to(route, { drawSVG: '100%', duration: .55, ease: 'none' }, 'continuidade')
    .to(signal, { motionPath: { path: route, align: route, alignOrigin: [.5, .5], autoRotate: false, start: destinationProgress, end: 1 }, duration: .55, ease: 'none' }, 'continuidade')
    .addLabel('conclusao', .9)
    .to(signal, { autoAlpha: 0, duration: .15 }, 'conclusao');

  if (scope.mobile) {
    const first = base().duration(.7);
    enter(scope, mobileIds[0], entries[0], first);
    const second = gsap.timeline().addLabel('ponte').add(bridge(), 0).addLabel('aplicacao', .85).add(destination(), 'aplicacao').addLabel('transicao', 1.75).duration(.9);
    // Use the child's completion point in the parent's local time, regardless
    // of the shorter mobile duration. Updates also cover direct seeks/anchors.
    second.eventCallback('onUpdate', () => { if (second.time() >= second.labels.transicao) transition.release(); });
    enter(scope, mobileIds[1], entries[1], second);
    if (completed) transition.release();
    return;
  }

  const tl: Timeline = remember(scope, 'journey', gsap.timeline({ paused: true }), root, 'scroll')
    .addLabel('estrutura', 0).add(base(), 0)
    .addLabel('base', .2)
    .addLabel('ponte', .45).add(bridge(), 'ponte')
    .addLabel('aplicacao', 1.3).add(destination(), 'aplicacao')
    .addLabel('transicao', 2.2)
    .addLabel('conclusao', 2.2);
  tl.eventCallback('onUpdate', () => { if (tl.time() >= tl.labels.transicao) transition.release(); });
  // Retain the same geometric start for the process after a completed journey
  // rebuild, even when its scrub trigger is no longer needed above the viewport.
  transition.setStartPosition(() => {
    const box = root.getBoundingClientRect();
    const top = box.top + (ScrollSmoother.get()?.scrollTop() ?? scrollY);
    const clamp = gsap.utils.clamp(0, ScrollTrigger.maxScroll(window));
    const start = clamp(top - innerHeight * .82);
    const end = clamp(top + box.height - innerHeight * .55);
    return start + (end - start) * tl.labels.transicao / tl.duration();
  });
  const { trigger } = scrubTimeline(scope, root, tl, {
    id: 'journey',
    start: 'clamp(top 82%)', end: 'clamp(bottom 55%)',
    // Geometry is rebuilt by the owning matchMedia scope on layout changes.
    // A position-only refresh must not recapture partially drawn stroke starts.
    scrub: motion.scrub,
  });
  transition.setStartPosition(() => trigger.start + (trigger.end - trigger.start) * tl.labels.transicao / tl.duration());
}
