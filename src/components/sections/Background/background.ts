import { gsap, SplitText, motion, revealText, iconStrokes, type MotionScope } from '../../../scripts/motion-config';
import { enterAfterJourney, scrubAfterJourney } from './background-entry';
import type { JourneyTransition } from '../ProfessionalJourney/journey-transition';

function animateEducation(root: HTMLElement, scope: MotionScope, transition: JourneyTransition) {
  const education = root.querySelector<HTMLElement>('.background__education')!;
  const tl = gsap.timeline({ paused: true, defaults: { ease: motion.ease.open } });
  education.querySelectorAll<SVGSVGElement>('.skill-tag__outline').forEach((svg) => {
    const { width, height } = svg.getBoundingClientRect();
    gsap.set(svg, { attr: { viewBox: `0 0 ${width} ${height}` } });
    gsap.set(svg.querySelector('path'), { attr: {
      'vector-effect': 'none',
      d: `M3 .5H${width - 3}Q${width - .5} .5 ${width - .5} 3V${height - 3}Q${width - .5} ${height - .5} ${width - 3} ${height - .5}H3Q.5 ${height - .5} .5 ${height - 3}V3Q.5 .5 3 .5Z`,
    }});
  });
  tl.addLabel('colunas', 0).addLabel('formacao', .15).addLabel('competencias', .55);
  tl.from(root.querySelectorAll('.background__column-rule'), { scaleY: 0, transformOrigin: 'top', duration: .6 }, 'colunas');
  revealText(scope, tl, education.querySelector('h2'), 0, { duration: .4 });
  education.querySelectorAll('.background__qualification').forEach((qualification, i) => {
    revealText(scope, tl, qualification.querySelector('.background__qualification-title'), .15 + i * .08, { duration: .35 });
    revealText(scope, tl, qualification.querySelector('.background__institution'), .25 + i * .08, { duration: .35 });
    const date = qualification.querySelector('.background__period');
    if (date) tl.from(date, { clipPath: 'inset(0 100% 0 0)', duration: .3 }, .3 + i * .08);
  });
  // Keep one semantic list; draw its actual visual rows after responsive layout.
  const rows = new Map<number, HTMLElement[]>();
  education.querySelectorAll<HTMLElement>('.skill-tag').forEach((tag) => {
    const top = Math.round(tag.getBoundingClientRect().top);
    rows.set(top, [...(rows.get(top) ?? []), tag]);
  });
  [...rows.values()].forEach((tags, i) => {
    const outlines = tags.flatMap(tag => [...tag.querySelectorAll('.skill-tag__outline path')]);
    tl.from(outlines, { drawSVG: 0, duration: .35, stagger: .025 }, .55 + i * .08);
    tl.fromTo(tags, { color: '#777' }, { color: '#b9b9b9', duration: .25, stagger: .025 }, .6 + i * .08);
  });
  enterAfterJourney(scope, transition, 'education', education, tl);
}

function animateProcess(root: HTMLElement, scope: MotionScope, transition: JourneyTransition) {
  const process = root.querySelector<HTMLElement>('.background__process')!;
  const steps = [...process.querySelectorAll<HTMLElement>('.process-step')];
  // Measure each connecting segment after fonts/layout settle, including wrapped descriptions.
  steps.slice(0, -1).forEach((step, i) => {
    const circle = step.querySelector('.process-step__icon')!.getBoundingClientRect();
    const next = steps[i + 1].querySelector('.process-step__icon')!.getBoundingClientRect();
    const gap = Math.max(0, next.top - circle.bottom);
    const svg = step.querySelector<SVGSVGElement>('.process-step__connector')!;
    gsap.set(svg, { height: gap, attr: { viewBox: `0 0 1 ${gap || 1}` } });
    gsap.set(svg.querySelector('path'), { attr: { d: `M.5 0V${gap}` } });
  });
  const head = gsap.timeline({ paused: true });
  revealText(scope, head, process.querySelector('h2'), 0);
  enterAfterJourney(scope, transition, 'process-heading', process.querySelector('h2')!, head);
  const build = (step: HTMLElement, index: number) => {
    const tl = gsap.timeline({ defaults: { ease: motion.ease.settle } });
    tl.addLabel('conexao', 0).addLabel('etapa', .2).addLabel('destaque', .42);
    if (index > 0) tl.from(steps[index - 1].querySelector('.process-step__connector path'), { drawSVG: 0, duration: .25 }, 0);
    tl.from(step.querySelector('.stroke-ring circle'), { drawSVG: 0, duration: .3 }, .15);
    tl.from(iconStrokes(step.querySelector('.process-step__glyph')!), { drawSVG: 0, duration: .3, stagger: .04 }, .28);
    tl.fromTo(step.querySelector('.process-step__title'), { color: '#a0a0a0' }, { color: '#e23845', duration: .25 }, .42);
    return tl;
  };
  if (!scope.mobile) {
    const tl = gsap.timeline({ paused: true });
    steps.forEach((step, i) => tl.addLabel(`etape-${i + 1}`).add(build(step, i)));
    scrubAfterJourney(scope, transition, process, tl);
  } else steps.forEach((step, i) => enterAfterJourney(scope, transition, `process-${i}`, step, build(step, i)));
}

function animateStatement(root: HTMLElement, scope: MotionScope, transition: JourneyTransition) {
  const panel = root.querySelector<HTMLElement>('.background__statement')!;
  const signature = panel.querySelector<HTMLElement>('.background__signature')!;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  const wrapped = signature.offsetHeight > parseFloat(getComputedStyle(signature).lineHeight) * 1.5;
  svg.innerHTML = `<defs><mask id="signature-write" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox"><path class="signature-guide" d="${wrapped ? 'M-.1 .25C.05 .1 .3 .42 .55 .23S.8 .25 1.1 .25' : 'M-.1 .5C.1 .3 .3 .65 .5 .47S.8 .5 1.1 .5'}" fill="none" stroke="white" stroke-width="${wrapped ? '.65' : '1.4'}" stroke-linecap="round"/>${wrapped ? '<path class="signature-guide" d="M-.1 .75C.1 .55 .35 .92 .55 .75S.9 .73 1.1 .75" fill="none" stroke="white" stroke-width=".65" stroke-linecap="round"/>' : ''}</mask></defs>`;
  panel.append(svg);
  scope.cleanups.push(() => svg.remove());
  const tl = gsap.timeline({ paused: true, defaults: { ease: motion.ease.settle } });
  tl.addLabel('profundidade', .2).addLabel('declaracao', .4).addLabel('assinatura', .85).addLabel('convite', 1.6);
  tl.from(panel.querySelector('.background__depth'), { clipPath: 'inset(0 100% 0 0)', duration: .7 }, 'profundidade');
  tl.from(panel.querySelector('.background__quote-mark'), { rotation: -12, scale: .7, transformOrigin: 'left bottom', duration: .6 }, .3);
  const quote = SplitText.create(panel.querySelector('.background__quote')!, { type: 'words', aria: 'none' });
  scope.cleanups.push(() => quote.revert());
  tl.fromTo(quote.words, { color: '#b89696' }, { color: '#e6d8d7', duration: .4, stagger: .028 }, 'declaracao');
  tl.set(signature, { mask: 'url(#signature-write)' }, 0);
  tl.from(svg.querySelectorAll('.signature-guide'), { drawSVG: 0, duration: .65, stagger: .18, ease: 'none' }, 'assinatura');
  tl.set(signature, { clearProps: 'mask' }, 1.68);
  revealText(scope, tl, panel.querySelector('.background__invitation'), 1.6, { duration: .35 });
  enterAfterJourney(scope, transition, 'statement', panel, tl);
}

export function animateBackground(root: HTMLElement, scope: MotionScope, transition: JourneyTransition) {
  animateEducation(root, scope, transition);
  animateProcess(root, scope, transition);
  animateStatement(root, scope, transition);
}
