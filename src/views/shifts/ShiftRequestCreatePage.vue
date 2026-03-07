<script setup>
import {
  IonContent,
  IonSelect,
  IonTextarea,
  IonPage,
  IonRow,
  IonSelectOption,
  IonButton,
  IonCol,
  useIonRouter,
  IonInput,
  onIonViewWillEnter,
  IonSpinner,
  IonText,
  IonLabel,
  toastController,
} from "@ionic/vue";
import LeavesHeader from "@/components/leaves/Header.vue";
import { chevronDownOutline } from "ionicons/icons";
import Datepicker from "@/components/base/Datepicker.vue";
import IconAccountClock from "@/components/icon/AccountClock.vue";
import { useLangStore } from "@/store/lang.js";
import { ref, reactive, computed, shallowRef, watch } from "vue";
import useDateHelper from "@/composable/useDateHelper";
import { useUserStore } from "@/store/user.js";
import shiftsApi from "@/api/shifts.ts";
import { useCustomToast } from "@/composable/toast";
import { useI18n } from "vue-i18n";

const userStore = useUserStore();
const router = useIonRouter();
const langStore = useLangStore();
const { formatDate, dayjs } = useDateHelper();
const { showSuccessToast, showErrorToast } = useCustomToast();
const { t } = useI18n();

const isLoading = ref(false);
const employeeName = computed(() => userStore.user?.employee_name || "N/A");

const form = ref({
  purpose: "",
  from_date: null,
  to_date: null,
  reason: "",
});

const errors = ref({
  purpose: false,
  from_date: false,
  to_date: false,
});

const isFromDatePickerOpen = shallowRef(false);
const isToDatePickerOpen = shallowRef(false);
const isSubmitting = ref(false);

const triggerBack = () => {
  router.back();
};

const showToast = async (message, color = "dark", duration = 2000) => {
  const toast = await toastController.create({
    message,
    duration,
    color,
    position: "bottom",
  });
  await toast.present();
};

const validateForm = () => {
  errors.value.purpose = !form.value.purpose;
  errors.value.from_date = !form.value.from_date;
  errors.value.to_date = !form.value.to_date;

  if (errors.value.purpose || errors.value.from_date || errors.value.to_date) {
    showErrorToast(t("user.shifts.create_shift.validation_error"));
    return false;
  }

  if (form.value.from_date && form.value.to_date) {
    if (dayjs(form.value.to_date).isBefore(dayjs(form.value.from_date), 'day')) {
      showErrorToast(t("user.shifts.create_shift.date_error"));
      return false;
    }
  }

  return true;
};

const submitForm = async () => {
  if (!validateForm()) return;

  try {
    isSubmitting.value = true;
    const { data } = await shiftsApi.createShift({
      employee_id: userStore.user?.employee_id,
      purpose: form.value.purpose,
      from_date: dayjs(form.value.from_date).format("YYYY-MM-DD"),
      to_date: dayjs(form.value.to_date).format("YYYY-MM-DD"),
      reason: form.value.reason,
    });

    if (data && data.status_code === 201) {
      showSuccessToast(t("user.shifts.create_shift.success_msg"));
      router.push(`/shifts/${data.data.name}`);
    }
  } catch (error) {
    showErrorToast(error?.data?.error || "Failed to create shift request");
  } finally {
    isLoading.value = false;
  }
};

onIonViewWillEnter(() => {
  form.value.purpose = "";
  form.value.from_date = null;
  form.value.to_date = null;
  form.value.reason = "";
});
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding shifts-page">
      <LeavesHeader
        class="shifts-page-header"
        :title="$t('user.shifts.new_shift_application')"
        @click-back="triggerBack"
      />

      <div class="shifts-employee-bar">
        <div class="employee-info">
          <ion-label class="form-label">{{ $t("user.shifts.create_shift.employee_name") }}</ion-label>
          <ion-input
            fill="outline"
            readonly
            class="form-input"
            :value="userStore.user?.employee_name"
          />
        </div>
      </div>

      <div class="shifts-form">
        <div class="form-group">
          <ion-label class="form-label">{{ $t("user.shifts.create_shift.purpose") }}</ion-label>
          <ion-select
            fill="outline"
            interface="action-sheet"
            :placeholder="$t('user.shifts.select_purpose')"
            v-model="form.purpose"
            class="form-select"
            :class="{ 'ion-touched ion-invalid': errors.purpose }"
            :toggleIcon="chevronDownOutline"
          >
            <ion-select-option value="Assign Day Off">
              {{ $t("user.shifts.card.purpose.assign_day_off") }}
            </ion-select-option>
            <ion-select-option value="Day Off Overtime">
              {{ $t("user.shifts.card.purpose.day_off_overtime") }}
            </ion-select-option>
          </ion-select>
        </div>

        <ion-row>
          <ion-col size="6">
            <div class="form-group">
              <ion-label class="form-label">{{ $t("user.shifts.create_shift.from_date") }}</ion-label>
              <ion-input
                fill="outline"
                readonly
                :placeholder="$t('user.shifts.select_date')"
                :value="form.from_date ? formatDate(form.from_date, 'DD-MM-YYYY') : ''"
                @ion-focus="isFromDatePickerOpen = true"
                class="form-input"
                :class="{ 'ion-touched ion-invalid': errors.from_date }"
              />
            </div>
          </ion-col>
          <ion-col size="6">
            <div class="form-group">
              <ion-label class="form-label">{{ $t("user.shifts.create_shift.to_date") }}</ion-label>
              <ion-input
                fill="outline"
                readonly
                :placeholder="$t('user.shifts.select_date')"
                :value="form.to_date ? formatDate(form.to_date, 'DD-MM-YYYY') : ''"
                @ion-focus="isToDatePickerOpen = true"
                class="form-input"
                :class="{ 'ion-touched ion-invalid': errors.to_date }"
              />
            </div>
          </ion-col>
        </ion-row>

        <!-- Pickers -->
        <Datepicker
          :lang="langStore.lang"
          :is-open="isFromDatePickerOpen"
          v-model="form.from_date"
          :minDate="new Date()"
          @cancel="isFromDatePickerOpen = false"
          @ok="isFromDatePickerOpen = false"
        />
        <Datepicker
          :lang="langStore.lang"
          :is-open="isToDatePickerOpen"
          v-model="form.to_date"
          :minDate="form.from_date || new Date()"
          @cancel="isToDatePickerOpen = false"
          @ok="isToDatePickerOpen = false"
        />

        <div class="form-group">
          <ion-label class="form-label">{{ $t("user.shifts.create_shift.reason") }}</ion-label>
          <ion-textarea
            fill="outline"
            :placeholder="$t('user.shifts.enter_reason')"
            v-model="form.reason"
            rows="4"
            class="form-textarea"
          />
        </div>

        <ion-button
          expand="block"
          shape="round"
          class="submit-button"
          @click="submitForm"
          :disabled="isSubmitting"
        >
          <ion-spinner v-if="isSubmitting" name="crescent"></ion-spinner>
          <span v-else>{{ $t("user.shifts.create_shift.save_shift_application") }}</span>
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped lang="scss">
.shifts-page {
  --padding-top: 0;
  --padding-bottom: 24px;
  --padding-start: 0;
  --padding-end: 0;

  &-header {
    position: sticky;
    top: 0;
    padding: 0 15px;
    z-index: 5;
    background: #191c1d;
  }
}

.shifts-create {
  padding: 16px;
}

.shifts-employee-bar {
  padding: 12px 16px;
  border-radius: 12px;
  background: #1e2529;
  border: 1px solid #364955;

  &-label {
    margin: 0;
    font-size: 0.75rem;
    color: #8b9298;
  }

  &-value {
    margin: 4px 0 0;
    font-size: 1rem;
    font-weight: 500;
    color: #e0e3e3;
  }
}

.shifts-create-label {
  color: #c0c7cd;
  font-size: 0.875rem;
  margin: 0 0 8px;

  &__required:after {
    content: "*";
    color: #ffb4a9;
    margin-left: 4px;
  }
}

.save-button {
  --background: #004c69;
  --color: #c1e8ff;
  margin-top: 32px;
}

.ion-select__custom {
  --placeholder-color: #8b9298;
  --placeholder-opacity: 1;
}
</style>
