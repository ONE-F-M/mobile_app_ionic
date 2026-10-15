// Compares dotted versions number by number ("1.10.0" is newer than "1.9.0").
// An empty or missing value is never older, so a missing setting lets the user in.
export function isOlder(a, b) {
  if (!a || !b) return false;
  const left = String(a).trim().split(".");
  const right = String(b).trim().split(".");
  if (!String(a).trim() || !String(b).trim()) return false;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) {
    const x = parseInt(left[i], 10) || 0;
    const y = parseInt(right[i], 10) || 0;
    if (x < y) return true;
    if (x > y) return false;
  }
  return false;
}

export default isOlder;
