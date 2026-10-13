import { ScrollSmoother, motion } from './motion-config';

let anchorFocus = false;
export const isNavigationFocus = () => anchorFocus;
export const headerOffset = () => (document.querySelector('.site-header')?.getBoundingClientRect().height ?? 0) + 12;
export const visualScroll = () => ScrollSmoother.get()?.scrollTop() ?? scrollY;
const positionKey = 'portfolioSmoothScroll';

/** Pinned content is measured through its stable flow spacer. */
export function documentTop(target: HTMLElement) {
  const measurement = target.parentElement?.classList.contains('pin-spacer') ? target.parentElement : target;
  return measurement.getBoundingClientRect().top + visualScroll();
}

/** Keep a distinct stop for short trailing sections that cannot reach the header. */
export function navigationStops(nodes: HTMLElement[]) {
  const offset = headerOffset();
  const maximum = Math.max(0, document.documentElement.scrollHeight - innerHeight);
  const stops = nodes.map(node => ({ node, position: Math.max(0, documentTop(node) - offset) }))
    .sort((a, b) => a.position - b.position);
  if (maximum === 0) return stops;
  const firstUnreachable = stops.findIndex(stop => stop.position > maximum);
  if (firstUnreachable !== -1) {
    const start = stops[firstUnreachable - 1]?.position ?? 0;
    const count = stops.length - firstUnreachable;
    // Distribute the remaining reading range in document order. Simply clamping
    // every stop to maximum would make Curriculum and Contact indistinguishable.
    stops.slice(firstUnreachable).forEach((stop, index) => {
      stop.position = start + (maximum - start) * (index + 1) / count;
    });
  }
  return stops;
}

export function createNavigation(root: HTMLElement, revealDestination: (target: HTMLElement | null, position?: number) => void) {
  const temporaryFocus = new Map<HTMLElement, () => void>();
  const hashTarget = () => {
    try { return document.getElementById(decodeURIComponent(location.hash.slice(1))); }
    catch { return null; }
  };
  const focusTarget = (target: HTMLElement) => {
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
      const restore = () => { target.removeAttribute('tabindex'); target.removeEventListener('blur', restore); temporaryFocus.delete(target); };
      temporaryFocus.set(target, restore);
      target.addEventListener('blur', restore, { once: true });
    }
    anchorFocus = true;
    target.focus({ preventScroll: true });
    anchorFocus = false;
  };
  const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - innerHeight);
  const scrollToPosition = (position: number, animate = false) => {
    const top = Math.max(0, Math.min(position, maxScroll()));
    const wrapper = document.getElementById('smooth-wrapper');
    if (wrapper) wrapper.scrollTop = 0;
    const smoother = ScrollSmoother.get();
    if (smoother) smoother.scrollTo(top, animate);
    else scrollTo({ top, behavior: animate && !matchMedia(motion.reduce).matches ? 'smooth' : 'instant' });
  };
  const alignTarget = (target: HTMLElement, animate = false) => {
    const wrapper = document.getElementById('smooth-wrapper');
    if (wrapper) wrapper.scrollTop = 0;
    const home = target === root || target.id === 'inicio';
    const hashes = [...new Set([...document.querySelectorAll<HTMLElement>('[data-header-target]')].map(link => link.dataset.headerTarget!))];
    const tracked = hashes.map(hash => document.getElementById(hash.slice(1))).filter((node): node is HTMLElement => !!node && root.contains(node));
    const stop = home ? undefined : navigationStops(tracked).find(stop => stop.node === target);
    const position = Math.max(0, Math.min(home ? 0 : stop?.position ?? documentTop(target) - headerOffset(), maxScroll()));
    revealDestination(target, position);
    scrollToPosition(position, animate);
  };
  const savePosition = () => history.replaceState({ ...history.state, [positionKey]: visualScroll() }, '', location.href);
  const navigate = (hash: string, animate = true) => {
    let target: HTMLElement | null;
    try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch { return; }
    if (!target || target !== root && !root.contains(target)) return;
    if (location.hash !== hash) {
      savePosition(); history.pushState({ ...history.state, [positionKey]: null }, '', hash);
    }
    // Explicit navigation must not rely on a second focus event at the destination.
    alignTarget(target, animate);
    focusTarget(target);
  };
  const click = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!anchor || anchor.hasAttribute('download') || anchor.target && anchor.target !== '_self') return;
    const url = new URL(anchor.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
    let target: HTMLElement | null;
    try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch { return; }
    if (!target || target !== root && !root.contains(target)) return;
    event.preventDefault(); navigate(url.hash);
  };
  const restoreInitial = (fromHistory = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type === 'back_forward') => {
    const position = history.state?.[positionKey];
    if (fromHistory && typeof position === 'number') { revealDestination(null); scrollToPosition(position); }
    else { const target = hashTarget(); if (target) alignTarget(target); }
  };
  let historyFrame = 0;
  let savedPosition: number | undefined;
  const historyChange = () => {
    cancelAnimationFrame(historyFrame);
    historyFrame = requestAnimationFrame(() => {
      if (savedPosition !== undefined) { revealDestination(null); scrollToPosition(savedPosition); }
      else { const target = hashTarget(); if (target) alignTarget(target); }
      savedPosition = undefined;
    });
  };
  const popstate = (event: PopStateEvent) => { savedPosition = typeof event.state?.[positionKey] === 'number' ? event.state[positionKey] : undefined; historyChange(); };
  document.addEventListener('click', click);
  window.addEventListener('hashchange', historyChange);
  window.addEventListener('popstate', popstate);
  window.addEventListener('pagehide', savePosition);
  return {
    navigate, restoreInitial,
    dispose: () => {
      cancelAnimationFrame(historyFrame);
      document.removeEventListener('click', click);
      window.removeEventListener('hashchange', historyChange);
      window.removeEventListener('popstate', popstate);
      window.removeEventListener('pagehide', savePosition);
      temporaryFocus.forEach(restore => restore());
    },
  };
}
export type Navigation = ReturnType<typeof createNavigation>;
