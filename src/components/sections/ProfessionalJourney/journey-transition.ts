import type { MotionScope } from "../../../scripts/motion-config";

export const JOURNEY_COMPLETE_EVENT = "portfolio:journey-complete";
const completionKey = "journey-transition";

/** One release per visit, retained across the owning matchMedia rebuilds. */
export function createJourneyTransition(root: HTMLElement, scope: MotionScope) {
  let released = scope.completed.has(completionKey);
  let startPosition = () => 0;
  const waiting = new Set<() => void>();
  const receive = () => {
    if (released) return;
    released = true;
    scope.completed.add(completionKey);
    const callbacks = [...waiting];
    waiting.clear();
    callbacks.forEach((callback) => callback());
  };
  root.addEventListener(JOURNEY_COMPLETE_EVENT, receive);
  scope.cleanups.push(() => {
    root.removeEventListener(JOURNEY_COMPLETE_EVENT, receive);
    waiting.clear();
  });
  return {
    get released() {
      return released;
    },
    release() {
      if (!released)
        root.dispatchEvent(
          new CustomEvent(JOURNEY_COMPLETE_EVENT, { bubbles: true }),
        );
    },
    subscribe(callback: () => void) {
      if (released) callback();
      else waiting.add(callback);
      return () => {
        waiting.delete(callback);
      };
    },
    setStartPosition(measure: () => number) {
      startPosition = measure;
    },
    startPosition() {
      return startPosition();
    },
  };
}

export type JourneyTransition = ReturnType<typeof createJourneyTransition>;
