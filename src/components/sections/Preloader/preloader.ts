import {
  gsap,
  ScrollTrigger,
  motion,
  type Timeline,
} from "../../../scripts/motion-config";
import {
  PRELOADER_RELEASE_EVENT,
  PRELOADER_STORAGE_KEY,
  preloaderPending,
  type ReleaseReason,
} from "../../../scripts/preloader-events";

export function startPreloader() {
  const root = document.documentElement;
  const element = document.querySelector<HTMLElement>(".preloader");
  const main = document.querySelector<HTMLElement>("main.portfolio");
  const skipLink = document.querySelector<HTMLElement>(".skip-link");
  const header = document.querySelector<HTMLElement>(".site-header");
  let draw: Timeline | undefined, exit: Timeline | undefined;
  let assetsReady = false,
    drawingReady = false,
    signaled = false,
    exiting = false;
  const button = element?.querySelector<HTMLButtonElement>(".preloader__skip");
  const activeElement = document.activeElement as HTMLElement | null;
  const reduce = matchMedia(motion.reduce);
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  const ctx = gsap.context(() => {}, element ?? undefined);
  const lock = (value: boolean) => {
    if (main) main.inert = value;
    if (skipLink) skipLink.inert = value;
    if (header) header.inert = value;
  };
  const signal = (reason: ReleaseReason, animated: boolean) => {
    if (signaled) return;
    signaled = true;
    root.dataset.preloader = animated ? "exiting" : "released";
    root.dataset.preloaderReason = reason;
    lock(false);
    window.dispatchEvent(
      new CustomEvent(PRELOADER_RELEASE_EVENT, {
        detail: { reason, animated },
      }),
    );
  };
  const close = () => {
    clearTimeout(watchdog);
    clearTimeout((window as any).__portfolioPreloaderFallback);
    root.dataset.preloader = "released";
    delete root.dataset.preloaderRunning;
    lock(false);
    if (element) {
      element.hidden = true;
      element.setAttribute("aria-hidden", "true");
    }
    if (button && document.activeElement === button) {
      // Restore the previous focus without scrolling when possible.
      const target =
        activeElement?.isConnected && activeElement !== document.body
          ? activeElement
          : main;
      target?.focus({ preventScroll: true });
    }
    ScrollTrigger.refresh();
  };
  const finish = (reason: ReleaseReason) => {
    draw?.pause();
    exit?.pause();
    signal(reason, false);
    close();
  };
  const release = () => {
    if (!assetsReady || !drawingReady || exiting || signaled || !element)
      return;
    exiting = true;
    clearTimeout(watchdog);
    clearTimeout((window as any).__portfolioPreloaderFallback);
    element.dataset.stage = "exit";
    element.querySelector(".preloader__status")!.textContent =
      element.dataset.readyLabel!;
    try {
      sessionStorage.setItem(PRELOADER_STORAGE_KEY, "1");
    } catch {
      // Private browsing can deny session storage; the opening still works.
    }
    ctx.add(() => {
      exit = gsap.timeline({
        onComplete: close,
        defaults: { ease: "power2.inOut" },
      });
      exit.addLabel("passagem", 0).addLabel("hero", 0.12);
      exit.to(
        element.querySelector(".preloader__composition"),
        { clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)", duration: 0.48 },
        0,
      );
      exit.to(button!, { autoAlpha: 0, duration: 0.22 }, 0);
      exit.to(
        element.querySelector(".preloader__curtain--left"),
        { xPercent: -100, duration: 0.9 },
        0.2,
      );
      exit.to(
        element.querySelector(".preloader__curtain--right"),
        { xPercent: 100, duration: 0.9 },
        0.2,
      );
      exit.call(() => signal("complete", true), [], "hero");
    });
  };
  const onSkip = () => {
    try {
      sessionStorage.setItem(PRELOADER_STORAGE_KEY, "1");
    } catch {
      // Skipping the opening must work even when session storage is unavailable.
    }
    finish("skip");
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape" && preloaderPending()) onSkip();
  };
  const onReduce = () => {
    if (reduce.matches) finish("reduced");
  };
  const onFallback = (event: Event) => {
    if ((event as CustomEvent).detail?.reason === "timeout" && !signaled) {
      signaled = true;
      draw?.pause();
      close();
    }
  };
  if (element && preloaderPending() && !reduce.matches) {
    lock(true);
    element.hidden = false;
    element.setAttribute("aria-hidden", "false");
    ctx.add(() => {
      const paths = element.querySelectorAll(".preloader__outline path");
      // Initialize every stroke synchronously while the mark is still hidden.
      // Staggered fromTo tweens defer later paths until their own start times.
      gsap.set(paths, { drawSVG: "0% 0%" });
      draw = gsap.timeline({
        paused: true,
        onComplete: () => {
          drawingReady = true;
          element.dataset.stage = "ready";
          release();
        },
      });
      draw.addLabel("traco", 0).addLabel("corpo", 1.25).addLabel("marca", 2.35);
      draw.fromTo(
        element.querySelector(".preloader__mark"),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.25, ease: "power1.out" },
        "traco",
      );
      draw.to(
        paths,
        {
          drawSVG: "0% 100%",
          duration: 1.65,
          stagger: 0.24,
          ease: "power1.inOut",
        },
        "traco",
      );
      // A deep-red ink wash passes behind the completed red outline, then is absorbed.
      draw.fromTo(
        element.querySelector(".preloader__ink"),
        { clipPath: "inset(0 100% 0 0)", opacity: 0 },
        {
          clipPath: "inset(0 0% 0 0)",
          opacity: 0.08,
          duration: 0.7,
          ease: "power1.inOut",
        },
        "corpo",
      );
      draw.to(
        element.querySelector(".preloader__ink"),
        { opacity: 0, duration: 0.4, ease: "power1.inOut" },
        1.95,
      );
      // Let the completed mark breathe briefly before handing off to the hero.
      draw.to({}, { duration: 0.35 }, "marca");
      draw.play(0);
      // Shorten the mandatory wait while preserving the authored stroke rhythm.
      draw.timeScale(matchMedia(motion.mobile).matches ? 1.8 : 1.35);
    });
    root.dataset.preloaderRunning = "true";
    button?.addEventListener("click", onSkip);
    window.addEventListener("keydown", onKey);
    reduce.addEventListener("change", onReduce);
    window.addEventListener(PRELOADER_RELEASE_EVENT, onFallback);
    watchdog = setTimeout(() => finish("timeout"), 5600);
  } else {
    signal((root.dataset.preloaderReason || "session") as ReleaseReason, false);
    close();
  }
  return {
    ready: () => {
      assetsReady = true;
      release();
    },
    fail: () => finish("error"),
    dispose: () => {
      clearTimeout(watchdog);
      clearTimeout((window as any).__portfolioPreloaderFallback);
      button?.removeEventListener("click", onSkip);
      window.removeEventListener("keydown", onKey);
      reduce.removeEventListener("change", onReduce);
      window.removeEventListener(PRELOADER_RELEASE_EVENT, onFallback);
      ctx.revert();
      close();
    },
    snapshot: () => ({
      state: root.dataset.preloader,
      stage: element?.dataset.stage,
      progress: draw?.progress(),
      released: signaled,
    }),
    seek: (progress: number) => {
      draw?.pause().progress(progress);
    },
  };
}
