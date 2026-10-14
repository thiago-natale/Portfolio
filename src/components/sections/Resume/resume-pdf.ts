// This entire module (including Mozilla's rendering code and CSS) loads on demand.
// Legacy distribution supplies the platform polyfills required by older Chrome/Safari.
import {
  getDocument,
  GlobalWorkerOptions,
  version,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";

// A CSS import in this module is eagerly hoisted by Astro's production build.
// Load the upstream stylesheet explicitly, once, alongside the on-demand reader.
let stylesheet: Promise<void> | undefined;
function loadStyles() {
  stylesheet ??= new Promise<void>((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `/pdfjs/pdf_viewer.css?v=${version}`;
    link.onload = () => resolve();
    link.onerror = () => {
      link.remove();
      stylesheet = undefined;
      reject(new Error("Could not load PDF reader styles"));
    };
    document.head.append(link);
  });
  return stylesheet;
}

export async function loadResumePdf(
  dialog: HTMLDialogElement,
  signal: AbortSignal,
) {
  // The web viewer expects pdfjsLib, established by the display-layer import above.
  const [, { PDFViewer, PDFLinkService, EventBus, GenericL10n }] =
    await Promise.all([
      loadStyles(),
      import("pdfjs-dist/legacy/web/pdf_viewer.mjs"),
    ]);
  if (signal.aborted) return;
  GlobalWorkerOptions.workerSrc = workerUrl;
  const container = dialog.querySelector<HTMLDivElement>(
    ".resume-viewer__viewport",
  )!;
  const pages = container.querySelector<HTMLDivElement>(".pdfViewer")!;
  const status = dialog.querySelector<HTMLElement>(".resume-viewer__status")!;
  const scale = dialog.querySelector<HTMLOutputElement>(
    ".resume-viewer__scale",
  )!;
  const count = dialog.querySelector<HTMLElement>(
    ".resume-viewer__page-count",
  )!;
  const controls = [
    ...dialog.querySelectorAll<HTMLButtonElement>("[data-pdf-control]"),
  ];
  const eventBus = new EventBus();
  const linkService = new PDFLinkService({
    eventBus,
    externalLinkTarget: 2,
    externalLinkRel: "noopener noreferrer",
  });
  const l10n = new GenericL10n("pt-BR");
  // The reader's own observers and scroll handlers must share our modal lifetime.
  const viewerOptions = {
    container,
    viewer: pages,
    eventBus,
    linkService,
    l10n,
    removePageBorders: true,
    maxCanvasPixels: 8_000_000,
    annotationEditorMode: -1,
    abortSignal: signal,
  };
  const viewer = new PDFViewer(viewerOptions);
  linkService.setViewer(viewer);
  const task = getDocument({
    url: dialog.dataset.pdfUrl!,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
    isEvalSupported: false,
  });
  let ready = false,
    fitting = true;
  let resizeTimer: ReturnType<typeof setTimeout>;
  container.scrollTop = 0;
  container.scrollLeft = 0;
  container.setAttribute("aria-busy", "true");
  const updateScale = () => {
    scale.value = `${Math.round(viewer.currentScale * 100)}%`;
  };
  const initialized = () => {
    if (signal.aborted) return;
    ready = true;
    viewer.currentScaleValue = "page-width";
    controls.forEach((control) => (control.disabled = false));
    updateScale();
  };
  const updatePage = () => {
    if (ready)
      count.textContent = `Página ${viewer.currentPageNumber} de ${viewer.pagesCount}`;
  };
  const rendered = (event: { pageNumber: number; error?: unknown }) => {
    if (signal.aborted) return;
    if (event.error) {
      dialog.dataset.pdf = "error";
      status.textContent =
        "Não foi possível exibir esta página. Abra o PDF em outra aba ou baixe o arquivo.";
    } else {
      dialog.dataset.pdf = "ready";
      status.textContent = "";
      viewer
        .getPageView(event.pageNumber - 1)
        ?.div.setAttribute(
          "aria-label",
          `Página ${event.pageNumber} do currículo`,
        );
    }
    container.setAttribute("aria-busy", "false");
    updatePage();
  };
  const control = (event: Event) => {
    if (!ready) return;
    const action = (event.currentTarget as HTMLElement).dataset.pdfControl;
    fitting = action === "fit";
    if (fitting) viewer.currentScaleValue = "page-width";
    else
      viewer.currentScale = Math.max(
        0.25,
        Math.min(3, viewer.currentScale * (action === "in" ? 1.2 : 1 / 1.2)),
      );
    updateScale();
  };
  const resize = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (signal.aborted || !ready) return;
      if (fitting) viewer.currentScaleValue = "page-width";
      viewer.update();
      updateScale();
    }, 120);
  });
  const cleanup = () => {
    ready = false;
    clearTimeout(resizeTimer);
    resize.disconnect();
    controls.forEach((button) => {
      button.removeEventListener("click", control);
      button.disabled = true;
    });
    eventBus.off("pagesinit", initialized);
    eventBus.off("pagerendered", rendered);
    eventBus.off("pagechanging", updatePage);
    eventBus.off("scalechanging", updateScale);
    viewer.setDocument(null);
    linkService.setDocument(null);
    viewer.cleanup();
    void l10n.destroy();
    void task.destroy().catch(() => {});
    pages.replaceChildren();
    scale.value = "—";
    count.textContent = "";
  };
  signal.addEventListener("abort", cleanup, { once: true });
  eventBus.on("pagesinit", initialized);
  eventBus.on("pagerendered", rendered);
  eventBus.on("pagechanging", updatePage);
  eventBus.on("scalechanging", updateScale);
  controls.forEach((button) => button.addEventListener("click", control));
  resize.observe(container);
  try {
    const pdf = await task.promise;
    if (signal.aborted) return;
    linkService.setDocument(pdf);
    viewer.setDocument(pdf);
  } catch (error) {
    if (signal.aborted) return;
    cleanup();
    signal.removeEventListener("abort", cleanup);
    throw error;
  }
}
