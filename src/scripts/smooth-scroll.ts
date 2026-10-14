import { ScrollSmoother, motion, type MotionScope } from "./motion-config";
import { headerOffset, isNavigationFocus } from "./navigation";
import { PRELOADER_RELEASE_EVENT, preloaderPending } from "./preloader-events";
import { pageScrollLocked, synchronizeScrollLock } from "./scroll-lock";

/** Navigation lives outside matchMedia so native/reduced motion uses the same anchors. */
export function createSmoothScroll(root: HTMLElement, scope: MotionScope) {
  const smoother = ScrollSmoother.create({
    wrapper: document.getElementById("smooth-wrapper")!,
    content: document.getElementById("smooth-content")!,
    smooth: scope.mobile ? motion.scroll.mobile : motion.scroll.desktop,
    smoothTouch: motion.scroll.touch,
    effects: false,
    normalizeScroll: false,
    ignoreMobileResize: true,
    onFocusIn: (_self, event) => {
      const target = event.target as HTMLElement;
      // A click on non-interactive content focuses main (tabindex=-1).
      // Its top is above the viewport whenever the reader has scrolled;
      // revealing that container would incorrectly send them back to the hero.
      if (
        target === root ||
        isNavigationFocus() ||
        preloaderPending() ||
        !root.contains(target)
      )
        return false;
      const box = target.getBoundingClientRect();
      if (box.top < headerOffset()) {
        smoother.scrollTo(
          smoother.scrollTop() + box.top - headerOffset(),
          true,
        );
        return false;
      }
    },
  });
  smoother.scrollTrigger.vars.id = "smooth-scroll";
  document.documentElement.dataset.scroll = "smooth";
  const release = () => {
    if (!pageScrollLocked()) smoother.paused(false);
  };
  if (preloaderPending()) {
    smoother.paused(true);
    window.addEventListener(PRELOADER_RELEASE_EVENT, release, { once: true });
  }
  synchronizeScrollLock();
  scope.cleanups.push(() => {
    window.removeEventListener(PRELOADER_RELEASE_EVENT, release);
    delete document.documentElement.dataset.scroll;
  });
  return { smoother };
}
