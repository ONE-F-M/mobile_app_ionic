import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import {
  getServiceRoute,
  serviceRouteMap,
  REGISTERED_SERVICE_ROUTES,
} from "@/utils/serviceRouteMap";

const routerSource = readFileSync(resolve(__dirname, "../../src/router/index.js"), "utf8");
const registeredInRouter = (path) =>
  routerSource.includes(`path: "${path}"`) || routerSource.includes(`path: '${path}'`);

describe("serviceRouteMap", () => {
  it("returns the route for services with a registered screen", () => {
    expect(getServiceRoute("Checkin Checkout")).toBe("/checkin");
    expect(getServiceRoute("Leaves")).toBe("/leaves");
    expect(getServiceRoute("New Leave Application")).toBe("/leaves/add");
    expect(getServiceRoute("Employee Resignation")).toBe("/resignation");
    expect(getServiceRoute("Uniform Request")).toBe("/uniform-request");
  });

  it("returns null for services whose route is not registered", () => {
    expect(getServiceRoute("Pay Slips")).toBeNull();
    expect(getServiceRoute("Advances")).toBeNull();
    expect(getServiceRoute("Letters")).toBeNull();
  });

  it("returns null for services with no mapping at all", () => {
    expect(getServiceRoute("Something Unknown")).toBeNull();
    expect(getServiceRoute(undefined)).toBeNull();
  });

  it("only allow-lists paths that router/index.js registers", () => {
    REGISTERED_SERVICE_ROUTES.forEach((path) => {
      expect(registeredInRouter(path), path).toBe(true);
    });
  });

  it("never returns a route outside the allow-list", () => {
    Object.keys(serviceRouteMap).forEach((service) => {
      const route = getServiceRoute(service);
      expect(route === null || REGISTERED_SERVICE_ROUTES.includes(route)).toBe(true);
    });
  });
});
