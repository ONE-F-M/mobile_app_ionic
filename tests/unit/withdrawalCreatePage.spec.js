import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test, vi } from "vitest";
import WithdrawalCreatePage from "@/views/resignation/WithdrawalCreatePage.vue";
import resignation from "@/api/resignation";
import { useUserStore } from "@/store/user.js";
import { useResignationStore } from "@/store/resignation.ts";

const { router, toast, viewWillEnter } = vi.hoisted(() => ({
  router: { canGoBack: () => true, back: vi.fn(), push: vi.fn() },
  toast: { showErrorToast: vi.fn(), showSuccessToast: vi.fn() },
  viewWillEnter: { callback: null },
}));

vi.mock("@ionic/vue", () => {
  const stub = (name) => ({ name, template: "<div><slot /></div>" });
  return {
    IonContent: stub("IonContent"),
    IonPage: stub("IonPage"),
    IonRow: stub("IonRow"),
    IonCol: stub("IonCol"),
    IonIcon: stub("IonIcon"),
    IonSpinner: stub("IonSpinner"),
    IonButton: { name: "IonButton", template: "<button><slot /></button>" },
    IonInput: {
      name: "IonInput",
      props: ["modelValue"],
      emits: ["update:modelValue"],
      template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    },
    onIonViewWillEnter: (callback) => {
      viewWillEnter.callback = callback;
    },
    useIonRouter: () => router,
  };
});
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key, fallback) => fallback ?? key }) }));
vi.mock("@/composable/toast.js", () => ({ useCustomToast: () => toast }));
vi.mock("@/composable/useSecondaryLanguage", () => ({
  useSecondaryLanguage: () => ({ bilingualInline: (text) => text }),
}));
vi.mock("@/composable/useConfirmAlert.ts", () => ({ useConfirmAlert: () => ({ showAcknowledge: vi.fn() }) }));
vi.mock("@/composable/useFileAttachment.ts", async () => {
  const { ref } = await import("vue");
  return {
    useFileAttachment: () => ({
      attachment: ref({ name: "letter.jpeg", base64: "data:image/jpeg;base64,LETTER" }),
      takePhoto: vi.fn(),
      clearAttachment: vi.fn(),
    }),
  };
});
vi.mock("@/api/resignation", () => ({
  default: { withdrawResignation: vi.fn(), getEmployeeSupervisor: vi.fn() },
}));

const ACTIVE_RESIGNATION = { name: "HR-RES-TEST", withdrawal_state: null };

const mountPage = async (withdrawalStateAfterFailure) => {
  const resignationStore = useResignationStore();
  const fetchActiveResignation = vi
    .spyOn(resignationStore, "fetchActiveResignation")
    .mockImplementationOnce(async () => {
      resignationStore.activeResignation = { ...ACTIVE_RESIGNATION };
    })
    .mockImplementationOnce(async () => {
      resignationStore.activeResignation = { ...ACTIVE_RESIGNATION, withdrawal_state: withdrawalStateAfterFailure };
    });

  const wrapper = mount(WithdrawalCreatePage, {
    global: {
      stubs: { PageHeader: true, ResignationTracker: true, BilingualText: true },
      mocks: { $t: (key, fallback) => fallback ?? key },
    },
  });
  await viewWillEnter.callback();
  await flushPromises();
  await wrapper.find('input[placeholder="Detailed reason..."]').setValue("Staying with the company");
  return { wrapper, fetchActiveResignation };
};

const submit = async (wrapper) => {
  await wrapper.find("button.submit-btn").trigger("click");
  await flushPromises();
};

describe("WithdrawalCreatePage.vue submit", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    const userStore = useUserStore();
    userStore.user = { employee_id: "HR-EMP-TEST" };
    userStore.token = "test-token";
    resignation.getEmployeeSupervisor.mockResolvedValue({
      data: { message: { user_id: "supervisor@example.com", full_name: "Test Supervisor", shift_working: 1 } },
    });
  });

  test("a submit that fails after the server saved the withdrawal shows it as under review", async () => {
    resignation.withdrawResignation.mockRejectedValue(new Error("Network Error"));
    const { wrapper, fetchActiveResignation } = await mountPage("Pending Supervisor");

    await submit(wrapper);

    expect(fetchActiveResignation).toHaveBeenCalledTimes(2);
    expect(toast.showSuccessToast).toHaveBeenCalledWith("Your resignation withdrawal is currently under review.");
    expect(toast.showErrorToast).not.toHaveBeenCalled();
    expect(router.back).toHaveBeenCalled();
  });

  test("a submit the server refused shows the server's message", async () => {
    const serverMessage = JSON.stringify({ message: "A withdrawal already exists for this resignation." });
    resignation.withdrawResignation.mockRejectedValue({
      status: 417,
      data: { _server_messages: JSON.stringify([serverMessage]) },
    });
    const { wrapper } = await mountPage(null);

    await submit(wrapper);

    expect(toast.showErrorToast).toHaveBeenCalledWith(
      null,
      "A withdrawal already exists for this resignation.",
      417
    );
    expect(router.back).not.toHaveBeenCalled();
  });

  test("an expired session keeps the session-expired message", async () => {
    resignation.withdrawResignation.mockRejectedValue({
      status: 401,
      message: "Client error occurred. Please check your request.",
      data: { message: "Your session has expired. Please log in again." },
    });
    const { wrapper } = await mountPage(null);

    await submit(wrapper);

    expect(toast.showErrorToast).toHaveBeenCalledWith(null, "Your session has expired. Please log in again.", 401);
  });
});
