import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, test, vi } from "vitest";
import PenaltyNoticeModal from "@/components/checkin/PenaltyNoticeModal.vue";
import checkin from "@/api/checkin";

const { showErrorToast } = vi.hoisted(() => ({ showErrorToast: vi.fn() }));

vi.mock("@ionic/vue", () => {
  const stub = (name) => ({ name, props: ["isOpen", "backdropDismiss", "canDismiss", "disabled"], template: "<div><slot /></div>" });
  return {
    IonModal: stub("IonModal"),
    IonRow: stub("IonRow"),
    IonSpinner: stub("IonSpinner"),
    IonButton: {
      name: "IonButton",
      props: ["disabled"],
      emits: ["click"],
      template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    },
  };
});
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key) => key }) }));
vi.mock("@/api/checkin", () => ({ default: { acknowledgePenalties: vi.fn() } }));
vi.mock("@/composable/toast.js", () => ({ useCustomToast: () => ({ showErrorToast }) }));

const PENALTIES = [
  {
    name: "PI-000001-HR-EMP-1",
    penalty_issuance: "PI-000001",
    issuer_name: "Ali Hassan",
    penalty_category: "Performance",
    penalty_occurence_time: "2026-11-20 08:30:00",
  },
  {
    name: "PI-000002-HR-EMP-1",
    penalty_issuance: "PI-000002",
    issuer_name: "Sara Khan",
    penalty_category: "Transportation",
    penalty_occurence_time: "2026-11-24 17:05:00",
  },
];

const mountModal = (penalties = PENALTIES) =>
  mount(PenaltyNoticeModal, {
    props: { penalties },
    global: { mocks: { $t: (key) => key }, stubs: { MdiIcon: true } },
  });

const modal = (wrapper) => wrapper.findComponent({ name: "IonModal" });

describe("PenaltyNoticeModal.vue", () => {
  beforeEach(() => vi.clearAllMocks());

  test("stays closed when nothing is pending", () => {
    expect(modal(mountModal([])).props("isOpen")).toBe(false);
  });

  test("lists every pending penalty in one notice", () => {
    const wrapper = mountModal();
    const text = wrapper.text();

    expect(modal(wrapper).props("isOpen")).toBe(true);
    expect(wrapper.findAll(".penalty-notice-card-item")).toHaveLength(2);
    for (const value of ["PI-000001", "Ali Hassan", "Performance", "20 Nov 2026, 08:30", "PI-000002", "Sara Khan"]) {
      expect(text).toContain(value);
    }
  });

  test("cannot be dismissed from the backdrop or by a gesture", async () => {
    const wrapper = mountModal();

    expect(modal(wrapper).props("backdropDismiss")).toBe(false);
    expect(await modal(wrapper).props("canDismiss")()).toBe(false);
  });

  test("dismiss acknowledges exactly the rows shown", async () => {
    checkin.acknowledgePenalties.mockResolvedValue({ data: { data: { acknowledged: 2 } } });
    const wrapper = mountModal();

    await wrapper.find("button").trigger("click");
    await flushPromises();

    expect(checkin.acknowledgePenalties).toHaveBeenCalledWith(["PI-000001-HR-EMP-1", "PI-000002-HR-EMP-1"]);
    expect(wrapper.emitted("acknowledged")).toHaveLength(1);
  });

  test("a failed dismiss keeps the notice and asks to try again", async () => {
    checkin.acknowledgePenalties.mockRejectedValue(new Error("Network Error"));
    const wrapper = mountModal();

    await wrapper.find("button").trigger("click");
    await flushPromises();

    expect(wrapper.emitted("acknowledged")).toBeUndefined();
    expect(modal(wrapper).props("isOpen")).toBe(true);
    expect(showErrorToast).toHaveBeenCalledWith(
      "user.checkin.penalty_notice.dismiss_failed",
      "user.checkin.penalty_notice.try_again",
    );
  });
});
