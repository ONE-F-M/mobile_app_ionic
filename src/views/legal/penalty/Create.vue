<script setup>
/**
 * Issue a penalty to one employee for one penalty type.
 *
 * The issuer, issuing time, Performance shift and routing (HR Enquiry or Legal Investigation)
 * are all set on the server; this screen only collects what happened, where, to whom and what for.
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
  IonPopover,
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
  blankPenaltyForm,
  buildPenaltyPayload,
  employeeKey,
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

const form = reactive(blankPenaltyForm());
/** Field -> i18n key of its error. */
const errors = reactive({});
const isSubmitting = ref(false);

const clearError = (field) => delete errors[field];

const triggerBack = () => {
  router.canGoBack() ? router.back() : router.push("/dashboard");
};

/** Server errors come back as { data: { message, error } }; a dropped request has no status. */
const showRequestError = (error) => {
  if (!error?.status) return showErrorToast(t("penalty.network_error"));
  showErrorToast(error?.data?.message, error?.data?.error, error?.status);
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

// Employee
const employeeQuery = ref("");
const employeeResults = ref([]);
const isEmployeeLoading = ref(false);

const onEmployeeSearch = async (event) => {
  employeeQuery.value = event.detail.value || "";
  const txt = employeeQuery.value.trim();
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

const selectEmployee = (employee) => {
  form.employee = employee;
  employeeQuery.value = "";
  employeeResults.value = [];
  clearError("employee");
};

const showEmployeeResults = computed(
  () =>
    employeeQuery.value.trim().length >= EMPLOYEE_SEARCH_MIN_CHARS && !isEmployeeLoading.value,
);

// Penalty Type
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
const penaltyTypeArabic = computed(
  () => penaltyTypes.value.find((type) => type.name === form.penalty_type)?.penalty_name_arabic,
);

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
  form.penalty_type = type.name;
  clearError("penalty_type");
  isTypeModalOpen.value = false;
};

// Attachment
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
  form.attachment = { name: file.name, dataUrl: await readAsDataUrl(file) };
};

/** Native opens the camera/gallery prompt; web falls through to the file input. */
const onAttachClick = async (event) => {
  if (!Capacitor.isNativePlatform()) return;
  event.preventDefault();
  const photo = await pickPhoto("penalty");
  if (photo) form.attachment = photo;
};

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
  Object.keys(errors).forEach(clearError);
  employeeQuery.value = "";
  employeeResults.value = [];
  loadPenaltyTypes();
});
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding">
      <PageHeader :title="$t('penalty.title')" @click-back="triggerBack" />

      <div class="penalty-form">
        <ion-segment v-model="form.penalty_category">
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
          <ion-popover
            :is-open="isDateOpen"
            :keep-contents-mounted="true"
            class="calendar-popover"
            @did-dismiss="isDateOpen = false"
          >
            <ion-datetime
              class="calendar"
              color="primary"
              presentation="date-time"
              :value="form.penalty_occurence_time || maxDate"
              :min="minDate"
              :max="maxDate"
              show-default-buttons
              @ion-change="onDateChange"
              @ion-cancel="isDateOpen = false"
            />
          </ion-popover>
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

        <div class="field" :class="{ 'has-error': errors.employee }">
          <span class="label">{{ $t("penalty.employee") }}</span>
          <div v-if="form.employee" class="row">
            <div class="row-body">
              <span class="value">{{ form.employee.employee_name }}</span>
              <span class="label">
                {{ form.employee.employee_id }} · {{ form.employee.designation }}
              </span>
            </div>
            <ion-button
              fill="clear"
              color="danger"
              :aria-label="$t('penalty.remove')"
              @click="form.employee = null"
            >
              <ion-icon slot="icon-only" :icon="closeCircleOutline" />
            </ion-button>
          </div>
          <template v-else>
            <ion-searchbar
              :value="employeeQuery"
              :placeholder="$t('penalty.search_employee')"
              debounce="300"
              @ion-input="onEmployeeSearch"
            />
            <ion-spinner v-if="isEmployeeLoading" name="crescent" />
            <ion-list v-if="showEmployeeResults">
              <ion-item
                v-for="employee in employeeResults"
                :key="employeeKey(employee)"
                button
                @click="selectEmployee(employee)"
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
          </template>
          <ion-text v-if="errors.employee" color="danger" class="error">
            {{ $t(errors.employee) }}
          </ion-text>
        </div>

        <div class="field" :class="{ 'has-error': errors.penalty_type }">
          <span class="label">{{ $t("penalty.penalty_type") }}</span>
          <ion-input
            fill="outline"
            readonly
            :placeholder="$t('penalty.select_penalty_type')"
            :value="form.penalty_type"
            @ion-focus="openTypePicker"
          />
          <span v-if="penaltyTypeArabic" class="label">{{ penaltyTypeArabic }}</span>
          <ion-text v-if="errors.penalty_type" color="danger" class="error">
            {{ $t(errors.penalty_type) }}
          </ion-text>
        </div>

        <ion-textarea
          v-model="form.exact_notes"
          class="field"
          fill="outline"
          :label="$t('penalty.remark')"
          label-placement="stacked"
          :placeholder="$t('penalty.remark_placeholder')"
          auto-grow
        />

        <div class="field">
          <span class="label">{{ $t("penalty.attachment") }}</span>
          <input
            id="penalty-attachment"
            type="file"
            accept="image/jpeg,image/png"
            class="file-input"
            @change="onFilePicked"
          />
          <label
            v-if="!form.attachment"
            for="penalty-attachment"
            class="attach-button"
            @click="onAttachClick"
          >
            {{ $t("penalty.add_attachment") }}
          </label>
          <div v-else class="preview">
            <img :src="form.attachment.dataUrl" :alt="form.attachment.name" />
            <ion-button fill="clear" color="danger" size="small" @click="form.attachment = null">
              {{ $t("penalty.remove") }}
            </ion-button>
          </div>
        </div>

        <ion-item lines="none" class="toggle">
          <ion-toggle v-model="form.third_party_damage">
            {{ $t("penalty.third_party_damage") }}
          </ion-toggle>
        </ion-item>

        <ion-button expand="block" :disabled="isSubmitting" @click="onSubmit">
          <ion-spinner v-if="isSubmitting" name="crescent" />
          <span v-else>{{ $t("penalty.submit") }}</span>
        </ion-button>
      </div>

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
ion-popover.calendar-popover {
  --background: #2a2d32;
  --box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  --border-radius: 12px;
  --width: min(340px, 92vw);
}

ion-datetime.calendar {
  --background: #2a2d32;
  --background-rgb: 42, 45, 50;
  --title-color: #ffffff;
  --color: #ffffff;
  --wheel-fade-background-rgb: 42, 45, 50;
  --wheel-highlight-background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

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
