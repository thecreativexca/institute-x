export const NOTIFICATIONS_REFRESH_EVENT = "notifications:refresh";

/** Ask open notification menus to reload from the API. */
export function refreshNotifications() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_REFRESH_EVENT));
}
