import { describe, expect, test } from "vitest";
import { buildStaticMapUrl, circlePoints, zoomForRadius } from "@/utils/staticMap";

// Kuwait City, roughly where the sites are — latitude matters for the zoom maths.
const LAT = 29.3759;
const LNG = 47.9774;

const EARTH_RADIUS_M = 6378137;

// Independent distance check, so the tests don't reuse the implementation's own maths.
const haversine = (lat1, lng1, lat2, lng2) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
};

describe("circlePoints", () => {
  test("returns a closed polygon of segments + 1 points", () => {
    const points = circlePoints(LAT, LNG, 100, 36);

    expect(points).toHaveLength(37);
    expect(points[36]).toEqual(points[0]);
  });

  test("every point sits at the requested radius from the centre", () => {
    const radius = 250;

    for (const [lat, lng] of circlePoints(LAT, LNG, radius)) {
      expect(haversine(LAT, LNG, lat, lng)).toBeCloseTo(radius, 1);
    }
  });

  test("holds up at a large radius", () => {
    const radius = 5000;

    for (const [lat, lng] of circlePoints(LAT, LNG, radius)) {
      expect(haversine(LAT, LNG, lat, lng)).toBeCloseTo(radius, 0);
    }
  });

  test("respects the segment count", () => {
    expect(circlePoints(LAT, LNG, 100, 12)).toHaveLength(13);
  });
});

describe("zoomForRadius", () => {
  test("zooms out as the geofence grows", () => {
    const tight = zoomForRadius(LAT, 50, 400);
    const wide = zoomForRadius(LAT, 2000, 400);

    expect(wide).toBeLessThan(tight);
  });

  test("clamps to the maximum for a tiny radius", () => {
    expect(zoomForRadius(LAT, 1, 400)).toBe(20);
  });

  test("clamps to the minimum for an enormous radius", () => {
    expect(zoomForRadius(LAT, 5_000_000, 400)).toBe(10);
  });

  test("falls back to the maximum when radius or size is missing", () => {
    expect(zoomForRadius(LAT, 0, 400)).toBe(20);
    expect(zoomForRadius(LAT, 100, 0)).toBe(20);
  });

  // The default 100m geofence should frame at least as tightly as the old fixed zoom 18.
  test("matches the previous fixed zoom at the default geofence radius", () => {
    expect(zoomForRadius(LAT, 100, 400)).toBe(18);
  });

  test("honours overridden padding and bounds", () => {
    expect(zoomForRadius(LAT, 100, 400, { padding: 1.3 })).toBe(17);
    expect(zoomForRadius(LAT, 1, 400, { max: 18 })).toBe(18);
  });

  test("keeps the geofence diameter inside the viewport", () => {
    const sizePx = 400;
    const radius = 300;
    const zoom = zoomForRadius(LAT, radius, sizePx);

    const metresPerPixel =
      (156543.03392 * Math.cos((LAT * Math.PI) / 180)) / 2 ** zoom;
    const visibleMetres = sizePx * metresPerPixel;

    expect(visibleMetres).toBeGreaterThan(radius * 2);
  });
});

describe("buildStaticMapUrl", () => {
  const base = {
    apiKey: "test-key",
    center: { lat: LAT, lng: LNG },
    marker: { lat: LAT, lng: LNG },
    circle: { lat: LAT, lng: LNG, radiusM: 100 },
    size: { width: 400, height: 800 },
  };

  test("returns empty without an api key or centre", () => {
    expect(buildStaticMapUrl({ ...base, apiKey: null })).toBe("");
    expect(buildStaticMapUrl({ ...base, center: null })).toBe("");
  });

  test("includes centre, size, scale, marker and key", () => {
    const url = new URL(buildStaticMapUrl(base));

    expect(url.origin + url.pathname).toBe(
      "https://maps.googleapis.com/maps/api/staticmap",
    );
    expect(url.searchParams.get("center")).toBe(`${LAT},${LNG}`);
    expect(url.searchParams.get("size")).toBe("400x640");
    expect(url.searchParams.get("scale")).toBe("2");
    expect(url.searchParams.get("markers")).toBe(`${LAT},${LNG}`);
    expect(url.searchParams.get("key")).toBe("test-key");
  });

  test("caps both dimensions at the Static API limit of 640", () => {
    const url = new URL(
      buildStaticMapUrl({ ...base, size: { width: 1200, height: 2400 } }),
    );

    expect(url.searchParams.get("size")).toBe("640x640");
  });

  test("draws the geofence as a filled path", () => {
    const url = new URL(buildStaticMapUrl(base));
    const path = url.searchParams.get("path");

    expect(path).toContain("fillcolor:0xff000059");
    expect(path).toContain("weight:3");
    // 37 points => 36 separators after the style prefix
    expect(path.split("|")).toHaveLength(40);
  });

  test("omits the path when there is no geofence", () => {
    const url = new URL(buildStaticMapUrl({ ...base, circle: null }));

    expect(url.searchParams.get("path")).toBeNull();
  });

  test("stays well inside the 16,384 character URL limit", () => {
    expect(buildStaticMapUrl(base).length).toBeLessThan(2000);
  });
});
