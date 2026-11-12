<script setup>
/**
 * Issue a penalty against one or more employees.
 *
 * The issuer, issuing time and routing (HR Enquiry or Legal Investigation) are all set
 * on the server; this screen only collects what happened, where, to whom and what for.
 */
import {
  IonButton,
  IonContent,
  IonDatetime,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
  onIonViewWillEnter,
  useIonRouter,
} from "@ionic/vue";
import { closeCircleOutline } from "ionicons/icons";
import { computed, nextTick, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Capacitor } from "@capacitor/core";

import PageHeader from "@/components/common/PageHeader.vue";
import penaltyApi from "@/api/penalty";
import useDateHelper from "@/composable/useDateHelper";
import { useCustomToast } from "@/composable/toast.js";
import { useFileAttachment } from "@/composable/useFileAttachment";
import {
  EMPLOYEE_SEARCH_MIN_CHARS,
  MAX_DAYS_BACK,
  PENALTY_CATEGORIES,
  PERFORMANCE,
  blankPenaltyForm,
  buildPenaltyPayload,
  employeeKey,
  hasEmployee,
  setCategory,
  validatePenaltyForm,
} from "@/utils/penaltyIssuance";

defineOptions({ name: "PenaltyIssuanceCreatePage" });

const { t } = useI18n();
const router = useIonRouter();
const { dayjs } = useDateHelper();
const { pickPhoto } = useFileAttachment();
const { showErrorToast, showSuccessToast } = useCustomToast();

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const SERVER_TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

const form = reactive(blankPenaltyForm());
/** Field -> i18n key of its error. */
const errors = reactive({});
const isSubmitting = ref(false);

const clearError = (field) => delete errors[field];
const isPerformance = computed(() => form.penalty_category === PERFORMANCE);

const triggerBack = () => {
  router.canGoBack() ? router.back() : router.push("/dashboard");
};

/** Server errors come back as { data: { message, error } }; a dropped request has no status. */
const showRequestError = (error) => {
  if (!error?.status) return showErrorToast(t("penalty.network_error"));
  showErrorToast(error?.data?.message, error?.data?.error, error?.status);
};

const onCategoryChange = (event) => {
  setCategory(form, event.detail.value);
  clearError("shift");
};

// Date & Time
const isDateOpen = ref(false);
const maxDate = computed(() => dayjs().format("YYYY-MM-DDTHH:mm"));
const minDate = computed(() =>
  dayjs().subtract(MAX_DAYS_BACK, "day").format("YYYY-MM-DDTHH:mm"),
);
const occurrenceLabel = computed(() =>
  form.penalty_occurence_time
    ? dayjs(form.penalty_occurence_time).format("DD-MM-YYYY HH:mm")
    : "",
);
const onDateChange = (event) => {
  form.penalty_occurence_time = event.detail.value;
  isDateOpen.value = false;
  clearError("penalty_occurence_time");
};

// Shift picker
const isShiftModalOpen = ref(false);
const shiftResults = ref([]);
const isShiftLoading = ref(false);

const loadShifts = async (txt = "") => {
  isShiftLoading.value = true;
  try {
    const { data } = await penaltyApi.getShifts(txt);
    shiftResults.value = data?.data ?? [];
  } catch (error) {
    shiftResults.value = [];
    showRequestError(error);
  } finally {
    isShiftLoading.value = false;
  }
};

const openShiftPicker = () => {
  isShiftModalOpen.value = true;
  loadShifts();
};

/** Site, project and site_location always follow the shift; they are never typed. */
const applyShift = (shift) => {
  form.shift = shift.shift || "";
  form.site = shift.site || "";
  form.project = shift.project || "";
  form.site_location = shift.site_location || "";
  clearError("shift");
};

const selectShift = (shift) => {
  applyShift(shift);
  isShiftModalOpen.value = false;
};

// ponytail: uses the first employee's roster when several are listed.
const isPulling = ref(false);
const pullAsCurrent = async () => {
  if (!form.employees.length || !form.penalty_occurence_time) {
    return showErrorToast(t("penalty.pull_needs_input"));
  }
  isPulling.value = true;
  try {
    const { data } = await penaltyApi.getCurrentAssignment(
      employeeKey(form.employees[0]),
      dayjs(form.penalty_occurence_time).format(SERVER_TIME_FORMAT),
    );
    if (data?.data?.shift) applyShift(data.data);
    else showErrorToast(t("penalty.no_current_assignment"));
  } catch (error) {
    showRequestError(error);
  } finally {
    isPulling.value = false;
  }
};

// Employees
const employeeQuery = ref("");
const employeeResults = ref([]);
const employeeMessage = ref("");
const isEmployeeLoading = ref(false);

const onEmployeeSearch = async (event) => {
  employeeQuery.value = event.detail.value || "";
  const txt = employeeQuery.value.trim();
  employeeMessage.value = "";
  if (txt.length < EMPLOYEE_SEARCH_MIN_CHARS) {
    employeeResults.value = [];
    return;
  }
  isEmployeeLoading.value = true;
  try {
    const { data } = await penaltyApi.searchEmployees(txt);
    // A slower response for an older query must not replace the current one.
    if (employeeQuery.value.trim() === txt) employeeResults.value = data?.data ?? [];
  } catch (error) {
    showRequestError(error);
  } finally {
    isEmployeeLoading.value = false;
  }
};

const addEmployee = (employee) => {
  if (hasEmployee(form, employee)) {
    employeeMessage.value = t("penalty.employee_already_added");
    return;
  }
  form.employees.push(employee);
  employeeQuery.value = "";
  employeeResults.value = [];
  employeeMessage.value = "";
  clearError("employees");
};

const showEmployeeResults = computed(
  () =>
    employeeQuery.value.trim().length >= EMPLOYEE_SEARCH_MIN_CHARS && !isEmployeeLoading.value,
);

const removeEmployee = (index) => form.employees.splice(index, 1);

// Violations
const penaltyTypes = ref([]);
const isTypeModalOpen = ref(false);
const typeQuery = ref("");
const typeResults = computed(() => {
  const query = typeQuery.value.trim().toLowerCase();
  if (!query) return penaltyTypes.value;
  return penaltyTypes.value.filter(
    (type) =>
      type.name.toLowerCase().includes(query) ||
      (type.penalty_name_arabic || "").includes(query) ||
      (type.penalty_code || "").toLowerCase().includes(query),
  );
});

const blankDraft = () => ({
  penalty_type: "",
  penalty_type_arabic: "",
  exact_notes: "",
  attachment: null,
});
const draft = reactive(blankDraft());
const draftError = ref("");

const loadPenaltyTypes = async () => {
  try {
    const { data } = await penaltyApi.getPenaltyTypes();
    penaltyTypes.value = data?.data ?? [];
  } catch (error) {
    penaltyTypes.value = [];
    showRequestError(error);
  }
};

const openTypePicker = () => {
  typeQuery.value = "";
  isTypeModalOpen.value = true;
};

const selectType = (type) => {
  draft.penalty_type = type.name;
  draft.penalty_type_arabic = type.penalty_name_arabic || "";
  draftError.value = "";
  isTypeModalOpen.value = false;
};

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const onFilePicked = async (event) => {
  const file = event.target.files?.[0];
  event.target.value = null;
  if (!file) return;
  if (!ALLOWED_TYPES.includes(file.type)) {
    return showErrorToast(t("penalty.errors.file_type"));
  }
  if (file.size > MAX_FILE_SIZE) return showErrorToast(t("penalty.errors.file_size"));
  draft.attachment = { name: file.name, dataUrl: await readAsDataUrl(file) };
};

/** Native opens the camera/gallery prompt; web falls through to the file input. */
const onAttachClick = async (event) => {
  if (!Capacitor.isNativePlatform()) return;
  event.preventDefault();
  const photo = await pickPhoto("penalty");
  if (photo) draft.attachment = photo;
};

const addViolation = () => {
  if (!draft.penalty_type) {
    draftError.value = t("penalty.errors.penalty_type_required");
    return;
  }
  form.violations.push({ ...draft });
  Object.assign(draft, blankDraft());
  draftError.value = "";
  clearError("violations");
};

const removeViolation = (index) => form.violations.splice(index, 1);

// Submit
const scrollToFirstError = async () => {
  await nextTick();
  document
    .querySelector(".penalty-form .has-error")
    ?.scrollIntoView({ behavior: "smooth", block: "center" });
};

const onSubmit = async () => {
  Object.keys(errors).forEach(clearError);
  Object.assign(errors, validatePenaltyForm(form));
  if (Object.keys(errors).length) {
    showErrorToast(t("penalty.fix_errors"));
    return scrollToFirstError();
  }

  isSubmitting.value = true;
  try {
    const { data } = await penaltyApi.submitPenaltyIssuance(buildPenaltyPayload(form));
    const { name, process_status } = data?.data ?? {};
    if (process_status === "Errored") {
      showErrorToast(t("penalty.process_errored", { name }), null, null, 6000);
    } else {
      showSuccessToast(t("penalty.success", { name }), 4000);
    }
    triggerBack();
  } catch (error) {
    // The form is left as it is, so the issuer can retry without re-entering anything.
    showRequestError(error);
  } finally {
    isSubmitting.value = false;
  }
};

onIonViewWillEnter(() => {
  Object.assign(form, blankPenaltyForm());
  Object.assign(draft, blankDraft());
  Object.keys(errors).forEach(clearError);
  employeeQuery.value = "";
  employeeResults.value = [];
  employeeMessage.value = "";
  draftError.value = "";
  loadPenaltyTypes();
});
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding">
      <PageHeader :title="$t('penalty.title')" @click-back="triggerBack" />

      <div class="penalty-form">
        <ion-segment :value="form.penalty_category" @ion-change="onCategoryChange">
          <ion-segment-button
            v-for="category in PENALTY_CATEGORIES"
            :key="category.value"
            :value="category.value"
          >
            <ion-label>{{ $t(`penalty.categories.${category.key}`) }}</ion-label>
          </ion-segment-button>
        </ion-segment>

        <div class="field" :class="{ 'has-error': errors.penalty_occurence_time }">
          <span class="label">{{ $t("penalty.occurrence_time") }}</span>
          <ion-input
            fill="outline"
            readonly
            :placeholder="$t('utils.select_date')"
            :value="occurrenceLabel"
            @ion-focus="isDateOpen = true"
          />
          <ion-text v-if="errors.penalty_occurence_time" color="danger" class="error">
            {{ $t(errors.penalty_occurence_time) }}
          </ion-text>
          <ion-modal :is-open="isDateOpen" @did-dismiss="isDateOpen = false">
            <ion-content>
              <ion-datetime
                presentation="date-time"
                :value="form.penalty_occurence_time || maxDate"
                :min="minDate"
                :max="maxDate"
                show-default-buttons
                @ion-change="onDateChange"
                @ion-cancel="isDateOpen = false"
              />
            </ion-content>
          </ion-modal>
        </div>

        <div class="field" :class="{ 'has-error': errors.penalty_location }">
          <span class="label">{{ $t("penalty.location") }}</span>
          <ion-input
            v-model="form.penalty_location"
            fill="outline"
            :placeholder="$t('penalty.location_placeholder')"
            @ion-input="clearError('penalty_location')"
          />
          <ion-text v-if="errors.penalty_location" color="danger" class="error">
            {{ $t(errors.penalty_location) }}
          </ion-text>
        </div>

        <div v-if="isPerformance" class="block">
          <h2 class="section">{{ $t("penalty.site_assignment") }}</h2>
          <div class="field" :class="{ 'has-error': errors.shift }">
            <span class="label">{{ $t("penalty.shift") }}</span>
            <ion-input
              fill="outline"
              readonly
              :placeholder="$t('penalty.select_shift')"
              :value="form.shift"
              @ion-focus="openShiftPicker"
            />
            <ion-text v-if="errors.shift" color="danger" class="error">
              {{ $t(errors.shift) }}
            </ion-text>
          </div>
          <ion-button
            expand="block"
            fill="outline"
            size="small"
            :disabled="isPulling"
            @click="pullAsCurrent"
          >
            <ion-spinner v-if="isPulling" name="crescent" />
            <span v-else>{{ $t("penalty.pull_as_current") }}</span>
          </ion-button>
          <div class="field">
            <span class="label">{{ $t("penalty.site") }}</span>
            <ion-input fill="outline" readonly :value="form.site" />
          </div>
          <div class="field">
            <span class="label">{{ $t("penalty.project") }}</span>
            <ion-input fill="outline" readonly :value="form.project" />
          </div>
          <div class="field">
            <span class="label">{{ $t("penalty.site_location") }}</span>
            <ion-input fill="outline" readonly :value="form.site_location" />
          </div>
        </div>

        <ion-item lines="none" class="toggle">
          <ion-toggle v-model="form.third_party_damage">
            {{ $t("penalty.third_party_damage") }}
          </ion-toggle>
        </ion-item>

        <div class="block" :class="{ 'has-error': errors.employees }">
          <h2 class="section">{{ $t("penalty.employees") }}</h2>
          <ion-searchbar
            :value="employeeQuery"
            :placeholder="$t('penalty.search_employee')"
            debounce="300"
            @ion-input="onEmployeeSearch"
          />
          <ion-spinner v-if="isEmployeeLoading" name="crescent" />
          <ion-text v-if="employeeMessage" color="danger" class="error">
            {{ employeeMessage }}
          </ion-text>
          <ion-list v-if="showEmployeeResults">
            <ion-item
              v-for="employee in employeeResults"
              :key="employeeKey(employee)"
              button
              @click="addEmployee(employee)"
            >
              <ion-label>
                <h2>{{ employee.employee_name }}</h2>
                <p>{{ employee.employee_id }} · {{ employee.designation }}</p>
              </ion-label>
            </ion-item>
            <ion-item v-if="!employeeResults.length" lines="none">
              <ion-label class="ion-text-center">{{ $t("penalty.no_employee_match") }}</ion-label>
            </ion-item>
          </ion-list>

          <div v-for="(employee, index) in form.employees" :key="employeeKey(employee)" class="row">
            <div class="row-body">
              <span class="value">{{ employee.employee_name }}</span>
              <span class="label">{{ employee.employee_id }} · {{ employee.designation }}</span>
            </div>
            <ion-button
              fill="clear"
              color="danger"
              :aria-label="$t('penalty.remove')"
              @click="removeEmployee(index)"
            >
              <ion-icon slot="icon-only" :icon="closeCircleOutline" />
            </ion-button>
          </div>
          <ion-text v-if="errors.employees" color="danger" class="error">
            {{ $t(errors.employees) }}
          </ion-text>
        </div>

        <div class="block" :class="{ 'has-error': errors.violations }">
          <h2 class="section">{{ $t("penalty.violations") }}</h2>

          <div v-for="(violation, index) in form.violations" :key="index" class="row">
            <div class="row-body">
              <span class="value">{{ violation.penalty_type }}</span>
              <span v-if="violation.penalty_type_arabic" class="label">
                {{ violation.penalty_type_arabic }}
              </span>
              <span v-if="violation.exact_notes" class="notes-preview">
                {{ violation.exact_notes }}
              </span>
              <span v-if="violation.attachment" class="label">
                {{ $t("penalty.attached") }}: {{ violation.attachment.name }}
              </span>
            </div>
            <ion-button
              fill="clear"
              color="danger"
              :aria-label="$t('penalty.remove')"
              @click="removeViolation(index)"
            >
              <ion-icon slot="icon-only" :icon="closeCircleOutline" />
            </ion-button>
          </div>

          <div class="draft">
            <span class="label">{{ $t("penalty.penalty_type") }}</span>
            <ion-input
              fill="outline"
              readonly
              :placeholder="$t('penalty.select_penalty_type')"
              :value="draft.penalty_type"
              @ion-focus="openTypePicker"
            />
            <span v-if="draft.penalty_type_arabic" class="label">
              {{ draft.penalty_type_arabic }}
            </span>
            <ion-text v-if="draftError" color="danger" class="error">{{ draftError }}</ion-text>

            <ion-textarea
              v-model="draft.exact_notes"
              :label="$t('penalty.notes')"
              label-placement="stacked"
              :placeholder="$t('penalty.notes_placeholder')"
              auto-grow
            />

            <div class="attachment">
              <span class="label">{{ $t("penalty.attachment") }}</span>
              <input
                id="penalty-attachment"
                type="file"
                accept="image/jpeg,image/png"
                class="file-input"
                @change="onFilePicked"
              />
              <label
                v-if="!draft.attachment"
                for="penalty-attachment"
                class="attach-button"
                @click="onAttachClick"
              >
                {{ $t("penalty.add_attachment") }}
              </label>
              <div v-else class="preview">
                <img :src="draft.attachment.dataUrl" :alt="draft.attachment.name" />
                <ion-button fill="clear" color="danger" size="small" @click="draft.attachment = null">
                  {{ $t("penalty.remove") }}
                </ion-button>
              </div>
            </div>

            <ion-button expand="block" fill="outline" @click="addViolation">
              {{ $t("penalty.add_violation") }}
            </ion-button>
          </div>
          <ion-text v-if="errors.violations" color="danger" class="error">
            {{ $t(errors.violations) }}
          </ion-text>
        </div>

        <ion-button expand="block" :disabled="isSubmitting" @click="onSubmit">
          <ion-spinner v-if="isSubmitting" name="crescent" />
          <span v-else>{{ $t("penalty.submit") }}</span>
        </ion-button>
      </div>

      <ion-modal :is-open="isShiftModalOpen" @did-dismiss="isShiftModalOpen = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ $t("penalty.select_shift") }}</ion-title>
            <ion-button slot="end" fill="clear" @click="isShiftModalOpen = false">
              {{ $t("utils.cancel") }}
            </ion-button>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-searchbar
            :placeholder="$t('penalty.search_shift')"
            debounce="300"
            @ion-input="loadShifts($event.detail.value || '')"
          />
          <ion-spinner v-if="isShiftLoading" name="crescent" />
          <ion-list v-else>
            <ion-item
              v-for="shift in shiftResults"
              :key="shift.shift"
              button
              @click="selectShift(shift)"
            >
              <ion-label>
                <h2>{{ shift.shift }}</h2>
                <p>{{ shift.site }} · {{ shift.project }}</p>
              </ion-label>
            </ion-item>
            <ion-item v-if="!shiftResults.length" lines="none">
              <ion-label class="ion-text-center">{{ $t("penalty.no_shift_match") }}</ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>

      <ion-modal :is-open="isTypeModalOpen" @did-dismiss="isTypeModalOpen = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ $t("penalty.select_penalty_type") }}</ion-title>
            <ion-button slot="end" fill="clear" @click="isTypeModalOpen = false">
              {{ $t("utils.cancel") }}
            </ion-button>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-searchbar
            v-model="typeQuery"
            :placeholder="$t('penalty.search_penalty_type')"
            debounce="200"
          />
          <ion-list>
            <ion-item v-for="type in typeResults" :key="type.name" button @click="selectType(type)">
              <ion-label>
                <h2>{{ type.name }}</h2>
                <p v-if="type.penalty_name_arabic">{{ type.penalty_name_arabic }}</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
.label {
  display: block;
  font-size: 12px;
  color: var(--ion-color-medium);
}

.value {
  display: block;
  font-size: 14px;
  font-weight: 600;
}

.field {
  margin: 12px 0;
}

.section {
  font-size: 15px;
  font-weight: 600;
  margin: 16px 0 8px;
}

.block {
  margin-bottom: 12px;
}

.error {
  display: block;
  font-size: 12px;
  margin: 2px 0 6px;
}

.toggle {
  --padding-start: 0;
  margin: 8px 0;
}

.row {
  display: flex;
  align-items: center;
  border: 1px solid var(--ion-color-light-shade);
  border-radius: 8px;
  padding: 8px 4px 8px 12px;
  margin-bottom: 8px;
}

.row-body {
  flex: 1;
  min-width: 0;
}

.notes-preview {
  display: block;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.draft {
  border: 1px dashed var(--ion-color-medium);
  border-radius: 8px;
  padding: 10px 12px;
}

.attachment {
  margin: 8px 0;
}

.file-input {
  display: none;
}

.attach-button {
  display: inline-block;
  margin-top: 4px;
  padding: 8px 14px;
  border: 1px dashed var(--ion-color-medium);
  border-radius: 6px;
  font-size: 13px;
}

.preview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;

  img {
    width: 64px;
    height: 64px;
    object-fit: cover;
    border-radius: 6px;
  }
}
</style>
