import { gsap, SplitText, motion, remember, revealText, type MotionScope } from '../../../scripts/motion-config';
import { PRELOADER_RELEASE_EVENT, preloaderPending } from '../../../scripts/preloader-events';
import { buildHeaderOpening } from '../Header/header-motion';

export function animateHero(root: HTMLElement, scope: MotionScope) {
  const q = (selector: string) => root.querySelector(selector);
  const waiting = preloaderPending();
  const tl = remember(scope, 'hero', gsap.timeline({ paused: waiting, defaults: { ease: motion.ease.open } }), root);
  tl.addLabel('estrutura', 0).addLabel('retrato', .35).addLabel('identidade', .65).addLabel('dados', 1.4);
  tl.add(buildHeaderOpening(document.querySelector('.site-header')!, scope), 'estrutura');
  tl.from(root.querySelectorAll('.hero__shutter'), {
    scaleY: 0, transformOrigin: '50% 100%', duration: .7,
    stagger: (i: number) => [0, .08, .02, .1, .04, .12, .06, .14][i],
  }, .15);
  root.querySelectorAll('linearGradient stop').forEach((stop) => {
    const final = stop.getAttribute('stop-color');
    tl.fromTo(stop, { attr: { 'stop-color': '#58070c' } }, { attr: { 'stop-color': final }, duration: .85 }, .15);
  });
  const portrait = q('.hero__portrait');
  tl.from(portrait, { clipPath: 'inset(100% 0 0 0)', scale: scope.mobile ? 1.012 : 1.025, duration: .85, transformOrigin: '50% 65%' }, 'retrato');
  tl.set(portrait, { willChange: 'clip-path, transform' }, 0);
  tl.set(portrait, { clearProps: 'willChange,clipPath,transform' }, 1.2);
  root.querySelectorAll('.hero__name > span').forEach((line, i) => {
    const split = SplitText.create(line, { type: 'chars', mask: 'chars', smartWrap: true, aria: 'none', charsClass: 'motion-char' });
    scope.cleanups.push(() => split.revert());
    tl.from(split.chars, { scaleY: .12, skewX: scope.mobile ? -4 : -9, transformOrigin: '50% 100%', duration: .6, stagger: .025 }, .65 + i * .08);
  });
  tl.from(q('.hero__greeting'), { clipPath: 'inset(0 100% 0 0)', duration: .5 }, .55);
  revealText(scope, tl, q('.hero__role'), 1, { duration: .45 });
  revealText(scope, tl, q('.hero__description'), 1.1, { duration: .5 });
  revealText(scope, tl, q('.hero__aside p'), 1.15);
  tl.from(q('.hero__spark circle'), { drawSVG: 0, duration: .65 }, 1);
  tl.from(q('.hero__star'), { rotation: -90, scale: .55, duration: .6, transformOrigin: '50% 50%', ease: motion.ease.settle }, 1.1);
  tl.from(q('.hero__location'), { clipPath: 'inset(0 100% 0 0)', duration: .45 }, 1.3);
  root.querySelectorAll('.stat').forEach((stat, i) => {
    const split = SplitText.create(stat.querySelector('.stat__digits')!, { type: 'chars', mask: 'chars', aria: 'none' });
    scope.cleanups.push(() => split.revert());
    const at = 1.4 + i * .13;
    tl.from(split.chars, { yPercent: 105, rotationX: -35, transformOrigin: '50% 100%', duration: .5, stagger: .03 }, at);
    tl.from(stat.querySelector('.stat__rule'), { scaleX: scope.mobile ? 1 : 0, scaleY: scope.mobile ? 0 : 1, transformOrigin: 'left top', duration: .4 }, at + .08);
    revealText(scope, tl, stat.querySelector('.stat__label'), at + .13, { duration: .35 });
  });
  const finishOnScroll = () => {
    if (scrollY > 8 && tl.progress() < 1) tl.timeScale(5);
  };
  window.addEventListener('scroll', finishOnScroll, { passive: true });
  scope.cleanups.push(() => window.removeEventListener('scroll', finishOnScroll));
  if (scope.completed.has('hero') || scrollY > 8) tl.progress(1).pause();
  if (scope.mobile) tl.timeScale(1.15);
  if (waiting && !scope.completed.has('hero') && scrollY <= 8) {
    const begin = () => tl.play(0);
    window.addEventListener(PRELOADER_RELEASE_EVENT, begin, { once: true });
    scope.cleanups.push(() => window.removeEventListener(PRELOADER_RELEASE_EVENT, begin));
  }
}
