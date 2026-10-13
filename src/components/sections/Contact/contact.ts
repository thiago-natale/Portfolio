import {
  gsap,
  motion,
  enter,
  revealText,
  iconStrokes,
  type MotionScope,
} from "../../../scripts/motion-config";

export function animateContact(root: HTMLElement, scope: MotionScope) {
  const tl = gsap.timeline({ defaults: { ease: motion.ease.open } });
  tl.addLabel("titulo", 0)
    .addLabel("canais", 0.25)
    .addLabel("ambiente", 0.5)
    .addLabel("conversa", 1);
  // Each authored title line is split separately, preserving its original wrapping.
  root
    .querySelectorAll("h2 > span")
    .forEach((line, i) =>
      revealText(scope, tl, line, i * 0.1, {
        duration: 0.5,
        scaleY: 0.6,
        transformOrigin: "bottom",
      }),
    );
  root.querySelectorAll(".contact-link").forEach((link, i) => {
    tl.from(
      link.querySelector(".stroke-ring circle"),
      { drawSVG: 0, duration: 0.4 },
      0.25 + i * 0.08,
    );
    tl.from(
      iconStrokes(link.querySelector(".contact-link__glyph")!),
      { drawSVG: 0, duration: 0.35, stagger: 0.02 },
      0.32 + i * 0.08,
    );
  });
  const visual = root.querySelector(".contact__visual");
  tl.set(visual, { willChange: "clip-path, transform" }, 0);
  tl.from(
    visual,
    {
      clipPath: "inset(0 100% 0 0)",
      scale: scope.mobile ? 1.015 : 1.03,
      transformOrigin: "bottom right",
      duration: 0.75,
    },
    "ambiente",
  );
  tl.set(visual, { clearProps: "clipPath,transform,willChange" }, 1.3);
  const cta = root.querySelector<HTMLAnchorElement>(".contact__cta")!;
  tl.from(
    cta.querySelector(".stroke-ring circle"),
    { drawSVG: "50% 50%", duration: 0.4 },
    "conversa",
  );
  tl.fromTo(
    cta,
    { color: "#a0a0a0" },
    { color: "#e23845", duration: 0.4 },
    "conversa",
  );
  enter(scope, "contact", root, tl);

  const shape = cta.querySelector<SVGPathElement>(".contact__morph")!;
  const hover = gsap.timeline({
    paused: true,
    defaults: { duration: 0.2, ease: motion.ease.response },
  });
  hover.to(shape, {
    morphSVG: { shape: shape.dataset.mailShape, shapeIndex: 0 },
  });
  const update = () => {
    const active = cta.matches(":hover") || cta.matches(":focus-visible");
    active ? hover.play() : hover.reverse();
  };
  ["pointerenter", "pointerleave", "focus", "blur"].forEach((name) =>
    cta.addEventListener(name, update),
  );
  // A keyboard focus can be the event that prepares this deferred section.
  // Its target focus event already fired before these listeners were installed.
  update();
  scope.cleanups.push(() =>
    ["pointerenter", "pointerleave", "focus", "blur"].forEach((name) =>
      cta.removeEventListener(name, update),
    ),
  );
  // Links are always available. Focusing one completes its entrance before interaction.
  const exposeOnFocus = () => tl.progress(1).pause();
  root.addEventListener("focusin", exposeOnFocus);
  scope.cleanups.push(() => root.removeEventListener("focusin", exposeOnFocus));
}
