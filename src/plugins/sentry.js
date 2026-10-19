import * as Sentry from "@sentry/capacitor";
import * as SentryVue from "@sentry/vue";
import { scrub } from "@/utils/sentryScrub.js";

export const initSentry = (app) => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init(
    {
      app,
      dsn,
      environment: import.meta.env.MODE,
      release: `one-fm-mobile@${__APP_VERSION__}`,
      sendDefaultPii: false,
      beforeSend: (event) => ({ ...scrub(event), user: undefined }),
      beforeBreadcrumb: (breadcrumb) => scrub(breadcrumb),
    },
    SentryVue.init,
  );
  // Android WebView user agents also contain AppleWebKit, so Chrome is checked first.
  const ua = navigator.userAgent;
  const match = /Chrome\/([\d.]+)/.exec(ua) || /AppleWebKit\/([\d.]+)/.exec(ua);
  if (match) Sentry.setTag("webview", `${match[0].split("/")[0]} ${match[1]}`);
};
