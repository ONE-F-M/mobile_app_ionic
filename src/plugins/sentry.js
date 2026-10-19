import * as Sentry from "@sentry/capacitor";
import * as SentryVue from "@sentry/vue";
import { scrub } from "@/utils/sentryScrub.js";

const WEBVIEW = /(Chrome|AppleWebKit)\/([\d.]+)/;

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
  const match = WEBVIEW.exec(navigator.userAgent);
  if (match) Sentry.setTag("webview", `${match[1]} ${match[2]}`);
};
