import {
  gsap,
  motion,
  enter,
  revealText,
  type MotionScope,
} from "../../../scripts/motion-config";

export function animateResume(root: HTMLElement, scope: MotionScope) {
  const tl = gsap.timeline({ defaults: { ease: motion.ease.open } });
  const speed = scope.mobile ? 0.8 : 1;
  tl.addLabel("estrutura", 0)
    .addLabel("identidade", 0.12 * speed)
    .addLabel("documento", 0.25 * speed)
    .addLabel("acoes", 0.55 * speed)
    .addLabel("conclusao", 0.8 * speed);
  tl.from(
    root.querySelector(".resume__rule"),
    { scaleX: 0, transformOrigin: "left", duration: 0.4 * speed },
    "estrutura",
  );
  root.querySelectorAll(".resume__title > span").forEach((line, i) =>
    revealText(scope, tl, line, (0.12 + i * 0.06) * speed, {
      duration: 0.45 * speed,
    }),
  );
  tl.from(
    root.querySelectorAll(".resume__symbol path"),
    { drawSVG: 0, duration: 0.45 * speed, stagger: 0.05 * speed },
    "documento",
  );
  tl.from(
    root.querySelector(".resume__metadata"),
    { clipPath: "inset(0 100% 0 0)", duration: 0.35 * speed },
    0.38 * speed,
  );
  tl.from(
    root.querySelectorAll(".resume__action"),
    {
      borderTopColor: "transparent",
      duration: 0.3 * speed,
      stagger: 0.08 * speed,
    },
    "acoes",
  );
  tl.from(
    root.querySelectorAll(".resume__action path, .resume__action circle"),
    { drawSVG: 0, duration: 0.35 * speed, stagger: 0.02 * speed },
    "acoes",
  );
  tl.to({}, { duration: 0.2 * speed }, "conclusao");
  enter(scope, "resume", root, tl);
}
