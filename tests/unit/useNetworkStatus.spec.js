import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getStatus: vi.fn(),
  addListener: vi.fn(),
  create: vi.fn(),
  present: vi.fn(),
  dismiss: vi.fn(),
}));

vi.mock("@capacitor/network", () => ({
  Network: { getStatus: mocks.getStatus, addListener: mocks.addListener },
}));

vi.mock("@ionic/vue", () => ({
  toastController: { create: mocks.create },
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key) => key }),
}));

import { useNetworkStatus } from "../../src/composable/useNetworkStatus.js";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("useNetworkStatus", () => {
  let emit;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.present.mockResolvedValue(undefined);
    mocks.dismiss.mockResolvedValue(undefined);
    mocks.create.mockResolvedValue({
      present: mocks.present,
      dismiss: mocks.dismiss,
    });
    mocks.addListener.mockImplementation(async (_event, handler) => {
      emit = handler;
      return { remove: vi.fn() };
    });
  });

  it("shows one persistent toast when the app starts offline", async () => {
    mocks.getStatus.mockResolvedValue({ connected: false });
    await useNetworkStatus().start();
    await flush();

    expect(mocks.addListener).toHaveBeenCalledWith(
      "networkStatusChange",
      expect.any(Function),
    );
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ message: "utils.offline", duration: 0 }),
    );
    expect(mocks.present).toHaveBeenCalledTimes(1);
  });

  it("does not stack a second toast on repeated offline events", async () => {
    mocks.getStatus.mockResolvedValue({ connected: false });
    await useNetworkStatus().start();
    await flush();

    emit({ connected: false });
    await flush();

    expect(mocks.create).toHaveBeenCalledTimes(1);
  });

  it("dismisses the toast when the connection returns", async () => {
    mocks.getStatus.mockResolvedValue({ connected: true });
    await useNetworkStatus().start();
    await flush();
    expect(mocks.create).not.toHaveBeenCalled();

    emit({ connected: false });
    await flush();
    expect(mocks.present).toHaveBeenCalledTimes(1);

    emit({ connected: true });
    await flush();
    expect(mocks.dismiss).toHaveBeenCalledTimes(1);
  });
});
