import {
  ScrollTrigger,
  ScrollSmoother,
  motion,
} from "../../../scripts/motion-config";
import {
  navigationStops,
  visualScroll,
  type Navigation,
} from "../../../scripts/navigation";
import { preloaderPending } from "../../../scripts/preloader-events";
import { buildMenuMotion } from "./header-motion";
import { lockPageScroll } from "../../../scripts/scroll-lock";

export function initializeHeader(navigation: Navigation) {
  const header = document.querySelector<HTMLElement>(".site-header")!;
  const dialog = document.querySelector<HTMLDialogElement>("#header-menu")!;
  const toggle = header.querySelector<HTMLButtonElement>(
    ".site-header__toggle",
  )!;
  const closeButton = dialog.querySelector<HTMLButtonElement>(
    ".header-menu__close",
  )!;
  const desktop = matchMedia(motion.desktop),
    reduce = matchMedia(motion.reduce);
  let scene: ReturnType<typeof buildMenuMotion> | undefined;
  let releaseScroll: (() => void) | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let destination: (() => void) | undefined;
  let closing = false,
    disposed = false;
  document.documentElement.dataset.header = "ready";
  header.dataset.enhanced = "true";

  const lockScroll = () => {
    releaseScroll = lockPageScroll();
  };
  const finishClose = (restoreFocus = true) => {
    clearTimeout(closeTimer);
    scene?.dispose();
    scene = undefined;
    const go = destination;
    destination = undefined;
    closing = false;
    const unlock = releaseScroll;
    releaseScroll = undefined;
    if (dialog.open) dialog.close();
    toggle.setAttribute("aria-expanded", "false");
    delete document.documentElement.dataset.menu;
    unlock?.();
    if (go) go();
    else if (restoreFocus && !desktop.matches)
      toggle.focus({ preventScroll: true });
  };
  const close = (
    immediate = false,
    after?: () => void,
    restoreFocus = true,
  ) => {
    if (!dialog.open) {
      after?.();
      return;
    }
    if (after) destination = after;
    if (immediate || reduce.matches || !scene) {
      finishClose(restoreFocus);
      return;
    }
    if (closing) return;
    closing = true;
    document.documentElement.dataset.menu = "closing";
    scene.timeline
      .eventCallback("onReverseComplete", () => finishClose(restoreFocus))
      .timeScale(2)
      .reverse();
    // A suspended background tab must never retain a stale scroll lock.
    closeTimer = setTimeout(() => finishClose(restoreFocus), 700);
  };
  const open = () => {
    if (desktop.matches || preloaderPending()) return;
    if (dialog.open) {
      clearTimeout(closeTimer);
      destination = undefined;
      closing = false;
      document.documentElement.dataset.menu = "open";
      scene?.timeline.timeScale(1).play();
      return;
    }
    lockScroll();
    dialog.showModal();
    toggle.setAttribute("aria-expanded", "true");
    document.documentElement.dataset.menu = "open";
    if (!reduce.matches) {
      scene = buildMenuMotion(dialog);
      scene.timeline.play(0);
    }
  };
  const closeClick = () => close();
  const cancel = (event: Event) => {
    event.preventDefault();
    close();
  };
  const nativeClose = () => {
    if (releaseScroll) finishClose();
  };
  const keyboard = (event: KeyboardEvent) => {
    if (event.key !== "Tab") return;
    const controls = [
      ...dialog.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      ),
    ];
    const first = controls[0],
      last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };
  const menuClick = (event: MouseEvent) => {
    if (
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const anchor = (event.target as Element).closest<HTMLAnchorElement>(
      "a[href]",
    );
    if (!anchor) return;
    const url = new URL(anchor.href, location.href);
    if (
      url.origin === location.origin &&
      url.pathname === location.pathname &&
      url.search === location.search &&
      url.hash
    ) {
      event.preventDefault();
      close(false, () => navigation.navigate(url.hash));
    } else close(true, undefined, false);
  };
  const links = [
    ...document.querySelectorAll<HTMLAnchorElement>("[data-header-target]"),
  ];
  const targets = [...new Set(links.map((link) => link.dataset.headerTarget!))]
    .map((hash) => document.getElementById(hash.slice(1)))
    .filter((node): node is HTMLElement => !!node);
  let stops: ReturnType<typeof navigationStops> = [];
  let current = "",
    frame = 0,
    maximum = 0;
  const updateActive = () => {
    const position = visualScroll(),
      threshold = position + 2;
    let next = "";
    stops.forEach((stop) => {
      if (stop.position <= threshold) next = `#${stop.node.id}`;
    });
    if (maximum > 0 && position >= maximum - 2) next = "#contato";
    if (next === current) return;
    current = next;
    links.forEach((link) => {
      if (link.dataset.headerTarget === current)
        link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };
  const measure = () => {
    if (disposed) return;
    maximum = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    stops = navigationStops(targets);
    updateActive();
  };
  const follow = () => {
    frame = 0;
    updateActive();
    const smoother = ScrollSmoother.get();
    if (
      smoother &&
      !smoother.paused() &&
      Math.abs(visualScroll() - scrollY) > 0.5
    )
      frame = requestAnimationFrame(follow);
  };
  const scroll = () => {
    if (!frame) frame = requestAnimationFrame(follow);
  };
  const layout = () => {
    if (dialog.open) close(true, undefined, false);
    measure();
  };
  const changeMotion = () => {
    if (dialog.open) close(true);
  };
  const leave = () => close(true, undefined, false);
  toggle.addEventListener("click", open);
  closeButton.addEventListener("click", closeClick);
  dialog.addEventListener("cancel", cancel);
  dialog.addEventListener("close", nativeClose);
  dialog.addEventListener("click", menuClick);
  dialog.addEventListener("keydown", keyboard);
  window.addEventListener("resize", layout);
  window.addEventListener("scroll", scroll, { passive: true });
  window.addEventListener("pageshow", layout);
  window.addEventListener("pagehide", leave);
  reduce.addEventListener("change", changeMotion);
  ScrollTrigger.addEventListener("refresh", measure);
  document.fonts.ready.then(measure);
  measure();
  return {
    measure,
    snapshot: () => ({
      open: dialog.open,
      closing,
      active: current,
      progress: scene?.timeline.progress() ?? (dialog.open ? 1 : 0),
      height: header.offsetHeight,
    }),
    dispose: () => {
      disposed = true;
      destination = undefined;
      finishClose(false);
      cancelAnimationFrame(frame);
      toggle.removeEventListener("click", open);
      closeButton.removeEventListener("click", closeClick);
      dialog.removeEventListener("cancel", cancel);
      dialog.removeEventListener("close", nativeClose);
      dialog.removeEventListener("click", menuClick);
      dialog.removeEventListener("keydown", keyboard);
      window.removeEventListener("resize", layout);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("pageshow", layout);
      window.removeEventListener("pagehide", leave);
      reduce.removeEventListener("change", changeMotion);
      ScrollTrigger.removeEventListener("refresh", measure);
      delete document.documentElement.dataset.header;
      links.forEach((link) => link.removeAttribute("aria-current"));
    },
  };
}
