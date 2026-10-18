import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  store: { token: "tok", refreshToken: "refresh" },
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: { getPlatform: () => "android" },
  CapacitorHttp: { get: mocks.get, post: mocks.post },
}));

vi.mock("../../src/store/user.js", () => ({
  useUserStore: () => ({
    token: mocks.store.token,
    refreshToken: mocks.store.refreshToken,
    logout: mocks.logout,
    setToken: vi.fn(),
    setRefreshToken: vi.fn(),
  }),
}));

vi.mock("../../src/api/authentication", () => ({
  default: { refreshToken: mocks.refreshToken },
}));

import {
  httpService,
  setRouter,
  setTranslator,
} from "../../src/api/http.service";

const router = { replace: vi.fn() };
const translations = {
  "utils.request_timeout.title": "Request timed out",
  "utils.request_timeout.message": "Check your connection and try again",
};

describe("httpService timeouts and session expiry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.store.refreshToken = "refresh";
    setRouter(router);
    setTranslator((key) => translations[key] ?? key);
  });

  it("passes connectTimeout and readTimeout of 20000 on a call", async () => {
    mocks.get.mockResolvedValue({ status: 200, data: {} });
    await httpService.get("ping");
    expect(mocks.get).toHaveBeenCalledWith(
      expect.objectContaining({ connectTimeout: 20000, readTimeout: 20000 }),
    );

    mocks.post.mockResolvedValue({ status: 200, data: {} });
    await httpService.post("ping", { data: { a: 1 } });
    expect(mocks.post).toHaveBeenCalledWith(
      expect.objectContaining({ connectTimeout: 20000, readTimeout: 20000 }),
    );
  });

  it("turns a timeout error into the translated message", async () => {
    mocks.get.mockRejectedValue(new Error("SocketTimeoutException: timeout"));
    await expect(httpService.get("ping")).rejects.toEqual({
      status: 0,
      data: {
        message: "Request timed out",
        error: "Check your connection and try again",
      },
    });

    mocks.get.mockRejectedValue(new Error("The request timed out."));
    await expect(httpService.get("ping")).rejects.toMatchObject({ status: 0 });
  });

  it("rethrows errors that are not timeouts", async () => {
    const boom = new Error("Network is unreachable");
    mocks.get.mockRejectedValue(boom);
    await expect(httpService.get("ping")).rejects.toBe(boom);
  });

  it("replaces the route with /employee-id on a 401 after a failed refresh", async () => {
    mocks.get.mockResolvedValue({ status: 401, data: {} });
    mocks.refreshToken.mockRejectedValue(new Error("refresh failed"));

    await expect(httpService.get("ping")).rejects.toMatchObject({
      status: 401,
      data: { message: "Your session has expired. Please log in again." },
    });

    expect(mocks.logout).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith("/employee-id");
  });
});
