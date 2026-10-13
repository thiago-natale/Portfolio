import { gsap, motion } from '../../../scripts/motion-config';
import { lockPageScroll } from '../../../scripts/scroll-lock';

/** Functional navigation remains available before JS and after load failures. */
export function initializeResume() {
  const dialog = document.querySelector<HTMLDialogElement>('#resume-viewer')!;
  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-resume-open]')];
  const closeButton = dialog.querySelector<HTMLButtonElement>('.resume-viewer__close')!;
  const surface = dialog.querySelector<HTMLElement>('.resume-viewer__surface')!;
  const status = dialog.querySelector<HTMLElement>('.resume-viewer__status')!;
  let opener: HTMLElement | undefined;
  let controller: AbortController | undefined;
  let unlock: (() => void) | undefined;
  let scene: gsap.core.Tween | undefined;
  let closing = false;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;

  const finishClose = (restoreFocus = true) => {
    clearTimeout(closeTimer); scene?.kill(); scene = undefined;
    controller?.abort(); controller = undefined;
    closing = false;
    if (dialog.open) dialog.close();
    unlock?.(); unlock = undefined;
    gsap.set(surface, { clearProps: 'clipPath' });
    links.forEach(link => link.setAttribute('aria-expanded', 'false'));
    if (restoreFocus && opener?.isConnected) opener.focus({ preventScroll: true });
    opener = undefined;
  };
  const close = () => {
    if (closing || !dialog.open) return;
    if (matchMedia(motion.reduce).matches) { finishClose(); return; }
    closing = true; scene?.kill();
    scene = gsap.to(surface, { clipPath: 'inset(0 0 100% 0)', duration: .2, ease: motion.ease.response, onComplete: () => finishClose() });
    closeTimer = setTimeout(() => finishClose(), 450);
  };
  const open = async (event: MouseEvent) => {
    if (event.defaultPrevented || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !dialog.showModal) return;
    event.preventDefault();
    if (dialog.open) return;
    opener = event.currentTarget as HTMLElement;
    links.forEach(link => link.setAttribute('aria-expanded', 'true'));
    controller = new AbortController(); const signal = controller.signal;
    unlock = lockPageScroll();
    dialog.showModal();
    closeButton.focus({ preventScroll: true });
    status.textContent = 'Carregando currículo…'; dialog.dataset.pdf = 'loading';
    if (!matchMedia(motion.reduce).matches) scene = gsap.fromTo(surface, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: .35, ease: motion.ease.open });
    try {
      const { loadResumePdf } = await import('./resume-pdf');
      if (!signal.aborted) await loadResumePdf(dialog, signal);
    } catch (error) {
      if (signal.aborted) return;
      dialog.dataset.pdf = 'error';
      dialog.querySelector('.resume-viewer__viewport')?.setAttribute('aria-busy', 'false');
      status.textContent = 'Não foi possível carregar a prévia. Você pode baixar o currículo ou abrir o PDF em outra aba.';
      console.error('Resume viewer failed:', error);
    }
  };
  const cancel = (event: Event) => { event.preventDefault(); close(); };
  const nativeClose = () => { if (unlock) finishClose(); };
  const background = (event: MouseEvent) => { if (event.target === dialog) close(); };
  const keyboard = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    // Include the PDF's dynamically created annotation links and reading region.
    const controls = [...dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(element => element.getClientRects().length > 0);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus({ preventScroll: true }); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus({ preventScroll: true }); }
  };
  const reducedChange = () => { if (closing) finishClose(); else { scene?.kill(); gsap.set(surface, { clearProps: 'clipPath' }); } };
  const reduced = matchMedia(motion.reduce);
  links.forEach(link => { link.setAttribute('aria-haspopup', 'dialog'); link.setAttribute('aria-controls', dialog.id); link.setAttribute('aria-expanded', 'false'); link.addEventListener('click', open); });
  closeButton.addEventListener('click', close);
  dialog.addEventListener('cancel', cancel); dialog.addEventListener('close', nativeClose); dialog.addEventListener('click', background);
  dialog.addEventListener('keydown', keyboard);
  reduced.addEventListener('change', reducedChange);
  return { dispose: () => {
    finishClose(false);
    links.forEach(link => { link.removeEventListener('click', open); ['aria-haspopup', 'aria-controls', 'aria-expanded'].forEach(attr => link.removeAttribute(attr)); });
    closeButton.removeEventListener('click', close);
    dialog.removeEventListener('cancel', cancel); dialog.removeEventListener('close', nativeClose); dialog.removeEventListener('click', background);
    dialog.removeEventListener('keydown', keyboard);
    reduced.removeEventListener('change', reducedChange);
  } };
}
