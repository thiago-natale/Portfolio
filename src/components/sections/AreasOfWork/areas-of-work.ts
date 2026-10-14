import {
  gsap,
  motion,
  remember,
  enter,
  revealText,
  scrubTimeline,
  type MotionScope,
} from "../../../scripts/motion-config";
import { headerOffset } from "../../../scripts/navigation";

function demonstrate(row: HTMLElement, scope: MotionScope) {
  const diagram = row.querySelector<SVGSVGElement>(".service-diagram")!;
  const tl = gsap.timeline({ defaults: { ease: motion.ease.settle } });
  tl.addLabel("tracar", 0)
    .addLabel("executar", 0.4)
    .addLabel("concluir", 1.05)
    .addLabel("beneficio", 1.3);
  tl.from(
    diagram.querySelectorAll(
      ".diagram__structure, .diagram__node, .diagram__target",
    ),
    { drawSVG: 0, duration: 0.45, stagger: 0.06 },
    "tracar",
  );
  const elements = diagram.querySelectorAll(".diagram__element");
  if (elements.length)
    tl.from(
      elements,
      {
        drawSVG: 0,
        scaleX: 0.5,
        transformOrigin: "left",
        duration: 0.4,
        stagger: 0.07,
      },
      0.2,
    );
  const signal = diagram.querySelector(".diagram__signal");
  tl.fromTo(
    signal,
    { autoAlpha: 0 },
    { autoAlpha: 1, duration: 0.05 },
    "executar",
  );
  tl.to(
    signal,
    {
      motionPath: {
        path: diagram.querySelector(".diagram__route"),
        align: diagram.querySelector(".diagram__route"),
        alignOrigin: [0.5, 0.5],
        autoRotate: false,
      },
      duration: 0.65,
      ease: "none",
    },
    "executar",
  );
  tl.fromTo(
    diagram.querySelector(".diagram__response"),
    { opacity: 0, scale: 0.65, transformOrigin: "50% 50%" },
    { opacity: 0.8, scale: 1, duration: 0.2 },
    "concluir",
  );
  tl.to(
    diagram.querySelector(".diagram__response"),
    { opacity: 0, scale: 1.12, duration: 0.25 },
    1.25,
  );
  tl.to(
    diagram.querySelector(".diagram__target"),
    { stroke: "#e23845", duration: 0.3 },
    "concluir",
  );
  const completion = diagram.querySelector<SVGPathElement>(
    ".diagram__completion",
  );
  if (completion) {
    tl.set(completion, { attr: { d: completion.dataset.startShape } }, 0);
    tl.from(completion, { drawSVG: 0, duration: 0.2 }, 0.3);
    tl.to(
      completion,
      { morphSVG: completion.dataset.finalShape, duration: 0.35 },
      "concluir",
    );
  }
  tl.to(signal, { autoAlpha: 0, duration: 0.15 }, 1.2);
  revealText(
    scope,
    tl,
    row.querySelector(".service-area__title > span:first-child"),
    0.05,
    { duration: 0.45 },
  );
  tl.fromTo(
    row.querySelector(".service-area__outcome"),
    { color: "#a0a0a0" },
    { color: "#e23845", duration: 0.3 },
    "beneficio",
  );
  if (scope.mobile) tl.duration(1.25);
  return tl;
}

export function animateAreas(root: HTMLElement, scope: MotionScope) {
  const head = gsap.timeline();
  head.from(root.querySelector(".areas-of-work__rule"), {
    scaleX: 0,
    transformOrigin: "left",
    duration: 0.5,
    ease: motion.ease.open,
  });
  revealText(scope, head, root.querySelector("h2"), 0);
  enter(scope, "areas-heading", root.querySelector("header")!, head);
  const rows = [...root.querySelectorAll<HTMLElement>(".service-area")];
  const canPin =
    scope.desktop && root.offsetHeight + headerOffset() + 40 <= innerHeight;
  root.dataset.pin = String(canPin);
  if (canPin) {
    const timeline = remember(
      scope,
      "areas",
      gsap.timeline({ paused: true }),
      root,
      "scroll",
    );
    ["interfaces", "integracoes", "automacao"].forEach((label, i) => {
      timeline.addLabel(label).add(demonstrate(rows[i], scope));
    });
    timeline.addLabel("conclusao");
    timeline.to({}, { duration: 0.15 });
    scrubTimeline(scope, root, timeline, {
      id: "areas",
      start: () => `top ${headerOffset()}`,
      end: () => `+=${innerHeight * motion.pinDistance}`,
      pin: true,
      pinType: "transform",
      scrub: motion.scrub,
    });
  } else {
    rows.forEach((row, i) =>
      enter(scope, `area-${i}`, row, demonstrate(row, scope)),
    );
  }
}
