import {
  gsap,
  SplitText,
  motion,
  revealText,
  type MotionScope,
} from "../../../scripts/motion-config";

export function buildHeaderOpening(root: HTMLElement, scope: MotionScope) {
  const tl = gsap.timeline({ defaults: { ease: motion.ease.open } });
  tl.addLabel("estrutura", 0)
    .addLabel("marca", 0.04)
    .addLabel("navegacao", 0.1)
    .addLabel("contato", 0.16);
  tl.from(
    root.querySelector(".site-header__rule"),
    { scaleX: 0, transformOrigin: "left", duration: 0.4 },
    0,
  );
  tl.from(
    root.querySelector(".brand-link__mark"),
    { clipPath: "inset(0 100% 0 0)", duration: 0.4 },
    0.04,
  );
  revealText(scope, tl, root.querySelector(".brand-link__name"), 0.04, {
    duration: 0.35,
  });
  revealText(scope, tl, root.querySelector(".brand-link__subtitle"), 0.08, {
    duration: 0.35,
  });
  root
    .querySelectorAll(".header-navigation__label")
    .forEach((label, i) =>
      revealText(scope, tl, label, 0.1 + i * 0.035, { duration: 0.35 }),
    );
  revealText(
    scope,
    tl,
    root.querySelector(".site-header__contact span"),
    0.16,
    { duration: 0.35 },
  );
  tl.from(
    root.querySelector(".site-header__contact svg"),
    { clipPath: "inset(100% 0 0 0)", duration: 0.35 },
    0.16,
  );
  tl.from(
    root.querySelector(".site-header__toggle"),
    { clipPath: "inset(0 100% 0 0)", duration: 0.35 },
    0.1,
  );
  return tl;
}

export function buildMenuMotion(dialog: HTMLDialogElement) {
  const splits: SplitText[] = [];
  let timeline!: gsap.core.Timeline;
  const context = gsap.context(() => {
    timeline = gsap.timeline({
      paused: true,
      defaults: { ease: motion.ease.open },
    });
    timeline
      .addLabel("painel", 0)
      .addLabel("acessos", 0.12)
      .addLabel("contato", 0.24);
    timeline.from(
      dialog.querySelector(".header-menu__surface"),
      { clipPath: "inset(0 0 100% 0)", duration: 0.38 },
      0,
    );
    timeline.from(
      dialog.querySelectorAll(".header-navigation__rule"),
      { scaleX: 0, transformOrigin: "left", duration: 0.3, stagger: 0.03 },
      0.12,
    );
    dialog.querySelectorAll(".header-navigation__label").forEach((label, i) => {
      const split = SplitText.create(label, {
        type: "lines",
        mask: "lines",
        linesClass: "menu-line",
        aria: "auto",
      });
      splits.push(split);
      // Start beyond the extra clip margin so accents do not peek out early.
      timeline.from(
        split.lines,
        { yPercent: 125, duration: 0.28 },
        0.12 + i * 0.04,
      );
      timeline.set(split.masks, { overflow: "visible" }, 0.4 + i * 0.04);
    });
    timeline.from(
      dialog.querySelector(".header-menu__contact"),
      { clipPath: "inset(0 100% 0 0)", duration: 0.26 },
      0.24,
    );
    timeline.from(
      dialog.querySelector(".header-menu__close-icon"),
      { rotation: -90, transformOrigin: "50% 50%", duration: 0.3 },
      0,
    );
  }, dialog);
  return {
    timeline,
    dispose: () => {
      context.revert();
      splits.forEach((split) => split.revert());
    },
  };
}
