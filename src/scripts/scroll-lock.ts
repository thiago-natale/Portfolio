import { ScrollSmoother } from "./motion-config";
import { preloaderPending } from "./preloader-events";

// Shared by modal surfaces. A rebuilt smoother inherits an existing lock.
const locks = new Set<symbol>();
let nativeRestore: (() => void) | undefined;
let lockedSmoother: ScrollSmoother | undefined;
let previouslyPaused = false;
export const pageScrollLocked = () => locks.size > 0;

export function synchronizeScrollLock() {
  if (!locks.size) return;
  const smoother = ScrollSmoother.get();
  if (smoother) {
    nativeRestore?.();
    nativeRestore = undefined;
    if (lockedSmoother !== smoother) {
      lockedSmoother = smoother;
      previouslyPaused = preloaderPending() ? false : smoother.paused();
    }
    smoother.paused(true);
  } else if (!nativeRestore) {
    const html = document.documentElement;
    const overflow = html.style.overflow,
      padding = html.style.paddingRight;
    const gap = innerWidth - html.clientWidth;
    html.style.paddingRight = `${parseFloat(getComputedStyle(html).paddingRight) + gap}px`;
    html.style.overflow = "hidden";
    nativeRestore = () => {
      html.style.overflow = overflow;
      html.style.paddingRight = padding;
    };
  }
}

export function lockPageScroll() {
  const token = Symbol("modal");
  locks.add(token);
  synchronizeScrollLock();
  return () => {
    if (!locks.delete(token) || locks.size) return;
    nativeRestore?.();
    nativeRestore = undefined;
    const smoother = ScrollSmoother.get();
    if (smoother && smoother === lockedSmoother && !preloaderPending())
      smoother.paused(previouslyPaused);
    lockedSmoother = undefined;
    previouslyPaused = false;
  };
}
