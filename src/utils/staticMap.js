// Helpers for building Maps Static API URLs. Billed per image request.

const EARTH_RADIUS_M = 6378137;
// Ground resolution at zoom 0 on the equator, in metres per pixel (256px world tile).
const METRES_PER_PIXEL_AT_ZOOM_0 = 156543.03392;
// Hard API limit. `scale` raises pixel density, not coverage, so it does not lift this cap.
const MAX_SIZE_PX = 640;

const STATIC_MAP_ENDPOINT = "https://maps.googleapis.com/maps/api/staticmap";

const toRadians = (degrees) => (degrees * Math.PI) / 180;
const toDegrees = (radians) => (radians * 180) / Math.PI;

/**
 * Points approximating a circle of `radiusM` around (lat, lng), as [lat, lng] pairs.
 *
 * The Static API has no circle primitive, so a geofence has to be drawn as a closed polygon.
 * The first point is repeated at the end to close it.
 */
export const circlePoints = (lat, lng, radiusM, segments = 36) => {
  const lat1 = toRadians(lat);
  const lng1 = toRadians(lng);
  const angularDistance = radiusM / EARTH_RADIUS_M;
  const points = [];

  for (let i = 0; i <= segments; i += 1) {
    // i === segments repeats bearing 0, closing the polygon.
    const bearing = (2 * Math.PI * (i % segments)) / segments;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angularDistance) +
        Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
    );

    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
        Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
      );

    points.push([toDegrees(lat2), toDegrees(lng2)]);
  }

  return points;
};

/**
 * Highest zoom at which a circle of `radiusM` still fits within `sizePx`.
 *
 * padding 1.0 means the circle spans the shorter axis exactly, leaving no margin. The image is
 * centred on the user rather than the site, so part of the circle is often off-frame anyway.
 */
export const zoomForRadius = (
  lat,
  radiusM,
  sizePx,
  { padding = 1.0, min = 10, max = 20 } = {},
) => {
  if (!radiusM || !sizePx) return max;

  const requiredMetres = radiusM * 2 * padding;
  const metresPerPixelAtZoom0 = METRES_PER_PIXEL_AT_ZOOM_0 * Math.cos(toRadians(lat));
  const zoom = Math.log2((sizePx * metresPerPixelAtZoom0) / requiredMetres);

  if (!Number.isFinite(zoom)) return max;

  return Math.max(min, Math.min(max, Math.floor(zoom)));
};

/**
 * Builds a Maps Static API URL. `center` and `marker` are {lat, lng}; `circle` is
 * {lat, lng, radiusM} and is drawn at the site, not the user.
 *
 * Unsigned: signatures are only required above 25,000 requests/day.
 */
export const buildStaticMapUrl = ({
  apiKey,
  center,
  marker,
  circle,
  size,
  scale = 2,
  strokeColor = "0xff0000ff",
  fillColor = "0xff000059",
  strokeWeight = 3,
}) => {
  if (!apiKey || !center) return "";

  const width = Math.min(MAX_SIZE_PX, Math.round(size?.width || MAX_SIZE_PX));
  const height = Math.min(MAX_SIZE_PX, Math.round(size?.height || MAX_SIZE_PX));

  // A circle has to fit on both axes, so the shorter one decides the zoom.
  const zoom = zoomForRadius(center.lat, circle?.radiusM ?? 0, Math.min(width, height));

  const params = new URLSearchParams();
  params.set("center", `${center.lat},${center.lng}`);
  params.set("zoom", String(zoom));
  params.set("size", `${width}x${height}`);
  params.set("scale", String(scale));

  if (marker) {
    params.append("markers", `${marker.lat},${marker.lng}`);
  }

  if (circle?.radiusM > 0) {
    // 6dp is ~0.1m precision, and keeps 37 points near 800 chars — well inside the 16,384 cap.
    const path = circlePoints(circle.lat, circle.lng, circle.radiusM)
      .map(([lat, lng]) => `${lat.toFixed(6)},${lng.toFixed(6)}`)
      .join("|");

    params.append(
      "path",
      `color:${strokeColor}|weight:${strokeWeight}|fillcolor:${fillColor}|${path}`,
    );
  }

  params.set("key", apiKey);

  return `${STATIC_MAP_ENDPOINT}?${params.toString()}`;
};
