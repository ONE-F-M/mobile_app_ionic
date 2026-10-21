import { beforeEach, describe, expect, test, vi } from "vitest";

const platform = { name: "ios" };
const post = vi.fn(async () => ({ status: 200, data: {} }));

vi.mock("@capacitor/core", () => ({
  Capacitor: { getPlatform: () => platform.name, isNativePlatform: () => platform.name !== "web" },
  CapacitorHttp: { post, get: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock("@/store/user.js", () => ({
  useUserStore: () => ({ token: "", refreshToken: "" }),
}));

const base64 = "AB+/cd+ef==";

const send = async (data, headers) => {
  const { httpService } = await import("@/api/http.service");
  await httpService.post("face_recognition.enroll", { data, headers });
  return post.mock.calls[0][0];
};

beforeEach(() => {
  vi.clearAllMocks();
  platform.name = "ios";
});

describe("httpService form encoding", () => {
  test("on iOS a form body is a string with + sent as %2B", async () => {
    const sent = await send({ video: base64, employee: "E 1" });
    expect(typeof sent.data).toBe("string");
    expect(sent.data).toContain("%2B");
    expect(sent.data).not.toContain("+/");
    expect(new URLSearchParams(sent.data).get("video")).toBe(base64);
  });

  test("on web a form body is a string with + sent as %2B", async () => {
    platform.name = "web";
    const sent = await send({ video: base64 });
    expect(typeof sent.data).toBe("string");
    expect(sent.data).toContain("%2B");
  });

  test("on Android the data object goes to CapacitorHttp as is", async () => {
    platform.name = "android";
    const data = { video: base64 };
    const sent = await send(data);
    expect(sent.data).toBe(data);
  });

  test("on iOS a JSON request keeps its data object", async () => {
    const data = { video: base64 };
    const sent = await send(data, { "Content-Type": "application/json" });
    expect(sent.data).toBe(data);
  });
});
