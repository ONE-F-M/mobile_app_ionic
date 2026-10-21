const FILTERED = "[Filtered]";
const SENSITIVE_KEY = /employee|token|authorization|password|secret|cookie|video|base64|attachment/i;
const SENSITIVE_PARAM = /((?:^|[?&])(?:employee_id|employee|token|password|api_key)=)[^&#\s]*/gi;
const BEARER = /\b(Bearer|token)\s+[\w.:-]+/gi;
const LONG_BASE64 = /[A-Za-z0-9+/=]{200,}/g;

export const scrubString = (value) =>
  value
    .replace(SENSITIVE_PARAM, `$1${FILTERED}`)
    .replace(BEARER, `$1 ${FILTERED}`)
    .replace(LONG_BASE64, FILTERED);

// Replaces personal data in a Sentry event or breadcrumb before it leaves the phone.
export const scrub = (value, key = "") => {
  if (SENSITIVE_KEY.test(key)) return FILTERED;
  if (typeof value === "string") return scrubString(value);
  if (Array.isArray(value)) return value.map((item) => scrub(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, scrub(v, k)]));
  }
  return value;
};
