import {
  gsap,
  ScrollTrigger,
  ScrollSmoother,
  motion,
  type MotionScope,
} from "./motion-config";
import { createSmoothScroll } from "./smooth-scroll";
import {
  createNavigation,
  isNavigationFocus,
  visualScroll,
} from "./navigation";
import { initializeHeader } from "../components/sections/Header/header";
import { animateHero } from "../components/sections/Hero/hero";
import { animateAreas } from "../components/sections/AreasOfWork/areas-of-work";
import {
  animateProfessionalJourney,
  measureJourneyRoute,
} from "../components/sections/ProfessionalJourney/professional-journey";
import {
  createJourneyTransition,
  type JourneyTransition,
} from "../components/sections/ProfessionalJourney/journey-transition";
import { animateBackground } from "../components/sections/Background/background";
import { animateContact } from "../components/sections/Contact/contact";
import { startPreloader } from "../components/sections/Preloader/preloader";
import { initializeResume } from "../components/sections/Resume/resume";
import { animateResume } from "../components/sections/Resume/resume-motion";
import { synchronizeScrollLock, pageScrollLocked } from "./scroll-lock";
import { preloaderPending } from "./preloader-events";

const completed = new Set<string>();
let dispose: (() => void) | undefined;
let generation = 0;

async function initialize() {
  const ticket = ++generation;
  dispose?.();
  const root = document.querySelector<HTMLElement>("main.portfolio");
  if (!root) return;
  const navigationRevealed = new Set<string>();
  const preparedSections = new Set<string>();
  let revealDestination = (_target: Element | null, _position?: number) => {};
  const navigation = createNavigation(root, (target, position) =>
    revealDestination(target, position),
  );
  const header = initializeHeader(navigation);
  const resume = initializeResume();
  const preloader = startPreloader();
  dispose = () => {
    resume.dispose();
    header.dispose();
    navigation.dispose();
    preloader.dispose();
  };
  let assetDeadline: ReturnType<typeof setTimeout>;
  // A stalled font or image must never keep the portfolio inaccessible.
  await Promise.race([
    Promise.all([
      document.fonts.ready,
      ...[
        ...root.querySelectorAll<HTMLImageElement>(".hero__portrait img"),
      ].map((image) => image.decode().catch(() => {})),
    ]),
    new Promise((resolve) => {
      assetDeadline = setTimeout(resolve, 5200);
    }),
  ]);
  clearTimeout(assetDeadline!);
  if (ticket !== generation || !root.isConnected) return;
  let mm = gsap.matchMedia();
  // Establish rollback before any initial styles are applied.
  dispose = () => {
    releaseNavigation();
    resume.dispose();
    mm.revert();
    header.dispose();
    navigation.dispose();
    preloader.dispose();
  };
  let activeScope: MotionScope | undefined;
  let activeTransition: JourneyTransition | undefined;
  let prepareSection = (_section: Element) => {};
  let navigationFrame = 0,
    arrived = false,
    resizing = false,
    destinationPosition = 0;
  const releaseNavigation = () => {
    cancelAnimationFrame(navigationFrame);
    navigationFrame = 0;
    navigationRevealed.clear();
    arrived = false;
    activeScope?.scrubs.forEach((scrub) => scrub.resume());
  };
  const followDestination = () => {
    navigationFrame = 0;
    if (!navigationRevealed.size) return;
    if (!preloaderPending() && !pageScrollLocked() && !resizing) {
      if (arrived && Math.abs(scrollY - destinationPosition) > 3) {
        releaseNavigation();
        return;
      }
      if (
        Math.abs(visualScroll() - destinationPosition) < 1 &&
        Math.abs(scrollY - destinationPosition) < 1
      ) {
        arrived = true;
        return;
      }
    }
    navigationFrame = requestAnimationFrame(followDestination);
  };
  const revealSection = (section: Element) => {
    prepareSection(section);
    navigationRevealed.add(section.id);
    activeScope?.targets.forEach((target, id) => {
      if (section.contains(target)) {
        const scrub = activeScope?.scrubs.get(id);
        if (scrub) scrub.hold();
        else activeScope?.timelines.get(id)?.progress(1).pause();
      }
    });
  };
  revealDestination = (target, position = 0) => {
    releaseNavigation();
    const section = target?.closest("section");
    if (!section || !root.contains(section)) return;
    // A direct home URL still receives the authored preloader/hero opening.
    if (section.id === "inicio" && preloaderPending()) return;
    revealSection(section);
    destinationPosition = position;
    navigationFrame = requestAnimationFrame(followDestination);
  };
  const build = () =>
    mm.add(
      { reduce: motion.reduce, any: "(min-width: 0px)" },
      (context) => {
        if (context.conditions?.reduce) {
          root.dataset.motion = "reduced";
          root.querySelector<HTMLElement>(".areas-of-work")!.dataset.pin =
            "false";
          synchronizeScrollLock();
          const { restore } = measureJourneyRoute(
            root.querySelector(".professional-journey")!,
          );
          return restore;
        }
        const scope: MotionScope = {
          mobile: matchMedia(motion.mobile).matches,
          desktop: matchMedia(motion.desktop).matches,
          completed,
          navigationRevealed,
          timelines: new Map(),
          targets: new Map(),
          scrubs: new Map(),
          cleanups: [],
        };
        activeScope = scope;
        try {
          createSmoothScroll(root, scope);
          animateHero(root.querySelector(".hero")!, scope);
          animateAreas(root.querySelector(".areas-of-work")!, scope);
          const journey = root.querySelector<HTMLElement>(
            ".professional-journey",
          )!;
          activeTransition = createJourneyTransition(journey, scope);
          const transition = activeTransition;
          const scenes = [
            {
              element: journey,
              build: () =>
                animateProfessionalJourney(journey, scope, transition),
            },
            {
              element: root.querySelector<HTMLElement>(".background")!,
              build: () =>
                animateBackground(
                  root.querySelector(".background")!,
                  scope,
                  transition,
                ),
            },
            {
              element: root.querySelector<HTMLElement>(".resume")!,
              build: () => animateResume(root.querySelector(".resume")!, scope),
            },
            {
              element: root.querySelector<HTMLElement>(".contact")!,
              build: () =>
                animateContact(root.querySelector(".contact")!, scope),
            },
          ];
          let prepared = -1;
          const observer = new IntersectionObserver(
            (entries) => {
              entries
                .filter((entry) => entry.isIntersecting)
                .forEach((entry) => prepare(entry.target));
            },
            { rootMargin: "50% 0px" },
          );
          const prepare = (section: Element) => {
            const index = scenes.findIndex(
              (scene) => scene.element === section,
            );
            if (index <= prepared) return;
            // Keep trigger order and the journey handoff, even on direct anchor jumps.
            context.add(() => {
              while (prepared < index) {
                const scene = scenes[++prepared];
                scene.build();
                preparedSections.add(scene.element.id);
                observer.unobserve(scene.element);
              }
            });
            ScrollTrigger.refresh();
          };
          prepareSection = prepare;
          scenes.forEach((scene) => observer.observe(scene.element));
          scope.cleanups.push(() => {
            observer.disconnect();
            prepareSection = () => {};
          });
          // Resizing an already visited page must restore its scrub drivers immediately.
          scenes
            .filter((scene) => preparedSections.has(scene.element.id))
            .forEach((scene) => prepare(scene.element));
        } catch (error) {
          context.revert();
          scope.cleanups.reverse().forEach((cleanup) => cleanup());
          throw error;
        }
        root.dataset.motion = "ready";
        ScrollTrigger.refresh();
        return () => {
          // Revert happens with matchMedia, then remove custom listeners/temporary DOM.
          scope.cleanups.reverse().forEach((cleanup) => cleanup());
          activeScope = undefined;
          activeTransition = undefined;
        };
      },
      root,
    );
  try {
    build();
    navigation.restoreInitial();
    header.measure();
    preloader.ready();
  } catch (error) {
    preloader.fail();
    throw error;
  }
  let width = innerWidth,
    height = innerHeight,
    resizeTimer: ReturnType<typeof setTimeout>;
  const resize = () => {
    clearTimeout(resizeTimer);
    resizing = true;
    // Mobile browser chrome changing height does not require rebuilding the narrative.
    resizeTimer = setTimeout(() => {
      if (
        width === innerWidth &&
        (innerWidth < 600 || height === innerHeight)
      ) {
        resizing = false;
        return;
      }
      width = innerWidth;
      height = innerHeight;
      const position = ScrollSmoother.get()?.scrollTop() ?? scrollY;
      mm.revert();
      mm = gsap.matchMedia();
      build();
      ScrollTrigger.refresh();
      ScrollSmoother.get()?.scrollTop(
        Math.min(position, ScrollTrigger.maxScroll(window)),
      );
      if (navigationRevealed.size) {
        destinationPosition = Math.min(
          position,
          ScrollTrigger.maxScroll(window),
        );
        arrived = false;
      }
      resizing = false;
    }, 250);
  };
  const focus = (event: FocusEvent) => {
    if (isNavigationFocus()) return;
    const element = event.target as HTMLElement;
    // Reveal the focused control's entrance, never complete a decorative scroll path.
    if (
      !element.matches(
        'a[href], button, input, select, textarea, [contenteditable="true"]',
      )
    )
      return;
    const section = element.closest("section");
    if (section) prepareSection(section);
    activeScope?.targets.forEach((target, id) => {
      if (target.contains(element) && !activeScope?.scrubs.has(id))
        activeScope?.timelines.get(id)?.progress(1).pause();
    });
  };
  const manualScroll = () => {
    if (navigationRevealed.size && !pageScrollLocked()) releaseNavigation();
  };
  const scrollKey = (event: KeyboardEvent) => {
    if (
      ![
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        " ",
      ].includes(event.key)
    )
      return;
    const element = event.target as HTMLElement;
    if (
      element.closest('input, textarea, select, [contenteditable="true"]') ||
      (event.key === " " && element.closest("button, a[href]"))
    )
      return;
    manualScroll();
  };
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("wheel", manualScroll, { passive: true });
  window.addEventListener("touchmove", manualScroll, { passive: true });
  window.addEventListener("keydown", scrollKey);
  const checkArrival = () => {
    if (arrived && !resizing && Math.abs(scrollY - destinationPosition) > 3)
      releaseNavigation();
  };
  window.addEventListener("scroll", checkArrival, { passive: true });
  root.addEventListener("focusin", focus);
  const restore = (event: PageTransitionEvent) => {
    if (event.persisted) {
      activeScope?.timelines.get("hero")?.progress(1);
      ScrollTrigger.refresh();
      navigation.restoreInitial(true);
    }
  };
  window.addEventListener("pageshow", restore);
  dispose = () => {
    clearTimeout(resizeTimer);
    releaseNavigation();
    window.removeEventListener("resize", resize);
    window.removeEventListener("wheel", manualScroll);
    window.removeEventListener("touchmove", manualScroll);
    window.removeEventListener("keydown", scrollKey);
    window.removeEventListener("scroll", checkArrival);
    window.removeEventListener("pageshow", restore);
    root.removeEventListener("focusin", focus);
    resume.dispose();
    mm.revert();
    header.dispose();
    navigation.dispose();
    preloader.dispose();
    delete root.dataset.motion;
  };
  if (import.meta.env.DEV) {
    // Dev-only deterministic visual QA. Never exposed in the production bundle.
    (window as any).__portfolioMotion = {
      snapshot: () => ({
        mode: root.dataset.motion,
        preloader: preloader.snapshot(),
        header: header.snapshot(),
        navigation: {
          target: [...navigationRevealed][0] ?? null,
          arrived,
          position: destinationPosition,
        },
        journeyReleased: activeTransition?.released ?? true,
        smoother: ScrollSmoother.get()
          ? {
              smooth: ScrollSmoother.get()!.smooth(),
              scrollTop: ScrollSmoother.get()!.scrollTop(),
              paused: ScrollSmoother.get()!.paused(),
            }
          : null,
        timelines: [...(activeScope?.timelines ?? [])].map(([id, tl]) => ({
          id,
          progress: tl.progress(),
          duration: tl.duration(),
          labels: tl.labels,
        })),
        triggers: ScrollTrigger.getAll().map((trigger) => ({
          id: trigger.vars.id,
          start: trigger.start,
          end: trigger.end,
          pin: !!trigger.pin,
        })),
      }),
      seek: (id: string, progress: number) => {
        if (!activeScope?.timelines.has(id))
          prepareSection(root.querySelector(".contact")!);
        activeScope?.timelines.get(id)?.pause().progress(progress);
      },
      finish: () => {
        prepareSection(root.querySelector(".contact")!);
        activeScope?.timelines.forEach((tl) => tl.progress(1).pause());
      },
      seekPreloader: (progress: number) => {
        preloader.seek(progress);
      },
    };
  }
}

initialize().catch((error) => {
  dispose?.();
  console.error("Portfolio motion initialization failed:", error);
});
document.addEventListener("astro:before-swap", () => {
  generation++;
  dispose?.();
});
document.addEventListener("astro:page-load", () =>
  initialize().catch(console.error),
);
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    generation++;
    dispose?.();
  });
