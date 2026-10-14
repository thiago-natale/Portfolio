export const PRELOADER_RELEASE_EVENT = "portfolio:preloader-release";
export const PRELOADER_STORAGE_KEY = "thiago-natale:preloader:v1";
export type ReleaseReason =
  | "complete"
  | "session"
  | "anchor"
  | "history"
  | "reduced"
  | "skip"
  | "timeout"
  | "error";
export interface PreloaderReleaseDetail {
  reason: ReleaseReason;
  animated: boolean;
}
export function preloaderPending() {
  return document.documentElement.dataset.preloader === "pending";
}
