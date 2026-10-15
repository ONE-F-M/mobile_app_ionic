// Where a notification tap goes when its url is missing, foreign or unknown.
export const NOTIFICATION_FALLBACK_PATH = "/notification";

// Turns a push payload url (data.url) into a path this router can open.
// Only same-origin urls are accepted; anything the router does not resolve
// (or anything unparsable) falls back to /notification.
export function toRouterPath(router, rawUrl) {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return NOTIFICATION_FALLBACK_PATH;
  }

  try {
    const parsed = new URL(rawUrl.trim(), window.location.origin);
    if (parsed.origin !== window.location.origin) {
      return NOTIFICATION_FALLBACK_PATH;
    }

    const path = parsed.pathname + parsed.search + parsed.hash;
    const resolved = router.resolve(path);
    return resolved.matched.length ? resolved.fullPath : NOTIFICATION_FALLBACK_PATH;
  } catch (err) {
    return NOTIFICATION_FALLBACK_PATH;
  }
}
