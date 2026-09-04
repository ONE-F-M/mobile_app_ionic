<script setup>
/**
 * WI-002301: report a damaged uniform item and ask for a replacement.
 *
 * The employee gives three things per item: which item, what size, and a photo of the
 * damage. Everything else the Request for Material needs - who it is for, their
 * department, the quantity, who approves it - the server works out, so the form never
 * asks and there is no Quantity field on this screen at all.
 */
import {
  IonButton,
  IonCol,
  IonContent,
  IonInput,
  IonPage,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  onIonViewWillEnter,
  useIonRouter,
} from "@ionic/vue";
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";

import PageHeader from "@/components/common/PageHeader.vue";
import Datepicker from "@/components/base/Datepicker.vue";
import uniformRequest from "@/api/uniform_request";
import useDateHelper from "@/composable/useDateHelper";
import { useCustomToast } from "@/composable/toast.js";
import { useUserStore } from "@/store/user.js";

const { t } = useI18n();
const router = useIonRouter();
const userStore = useUserStore();
const { showErrorToast, showSuccessToast } = useCustomToast();
const { dayjs } = useDateHelper();

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const isLoading = ref(false);
const isSubmitting = ref(false);
const itemOptions = ref([]);
const requiredDate = ref(null);

const blankRow = () => ({ item_code: "", size: "", photo: null, photoName: null });
const rows = reactive([blankRow()]);

/** Which field on which row the employee still has to fill. */
const errors = reactive({});
const errorFor = (index, field) => errors[`${index}.${field}`];
const clearError = (index, field) => {
  delete errors[`${index}.${field}`];
};

const requestedBy = computed(
  () => userStore.user?.employee_id || userStore.user?.name || "",
);
const today = computed(() => dayjs().format("YYYY-MM-DD"));

const fetchItems = async () => {
  isLoading.value = true;
  try {
    const { data } = await uniformRequest.getUniformItems();
    itemOptions.value = data?.data ?? [];
  } catch (error) {
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
    itemOptions.value = [];
  } finally {
    isLoading.value = false;
  }
};

const addRow = () => rows.push(blankRow());

const removeRow = (index) => {
  rows.splice(index, 1);
  if (!rows.length) rows.push(blankRow());
};

/** Base64 without the data-URL prefix, which is what the server decodes. */
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
  });

const onPhotoPicked = async (event, index) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!ALLOWED_TYPES.includes(file.type)) {
    event.target.value = null;
    return showErrorToast(t("user.uniform_request.errors.file_type"));
  }
  if (file.size > MAX_FILE_SIZE) {
    event.target.value = null;
    return showErrorToast(t("user.uniform_request.errors.file_size"));
  }

  try {
    rows[index].photo = await toBase64(file);
    rows[index].photoName = file.name;
    clearError(index, "photo");
  } catch {
    showErrorToast(t("user.uniform_request.errors.photo"));
  } finally {
    event.target.value = null;
  }
};

/**
 * Every row needs an item, a size and a photo. Checked before anything is sent so the
 * employee is told which row is short of what, rather than the whole form being refused.
 */
const validate = () => {
  Object.keys(errors).forEach((key) => delete errors[key]);

  rows.forEach((row, index) => {
    if (!row.item_code) errors[`${index}.item`] = t("user.uniform_request.errors.item");
    if (!row.size?.trim()) errors[`${index}.size`] = t("user.uniform_request.errors.size");
    if (!row.photo) errors[`${index}.photo`] = t("user.uniform_request.errors.photo");
  });

  return Object.keys(errors).length === 0;
};

const onSubmit = async () => {
  if (!validate()) {
    return showErrorToast(t("user.uniform_request.errors.incomplete"));
  }

  isSubmitting.value = true;
  try {
    const items = rows.map((row) => ({
      item_code: row.item_code,
      item_name: itemOptions.value.find((o) => o.item_code === row.item_code)?.item_name,
      size: row.size.trim(),
      attach_photo: { attachment_name: row.photoName, attachment: row.photo },
    }));

    await uniformRequest.createUniformRequest(
      items,
      requiredDate.value ? dayjs(requiredDate.value).format("YYYY-MM-DD") : undefined,
    );

    showSuccessToast(t("user.uniform_request.success"));
    router.push("/service");
  } catch (error) {
    showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
  } finally {
    isSubmitting.value = false;
  }
};

onIonViewWillEnter(() => {
  rows.splice(0, rows.length, blankRow());
  requiredDate.value = null;
  Object.keys(errors).forEach((key) => delete errors[key]);
  fetchItems();
});
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding">
      <PageHeader :title="$t('user.uniform_request.title')" @click-back="router.push('/service')" />

      <p class="subtitle">{{ $t("user.uniform_request.subtitle") }}</p>

      <!-- Filled in from the session, so the employee never types either. -->
      <ion-row class="summary">
        <ion-col size="6">
          <span class="label">{{ $t("user.uniform_request.requested_by") }}</span>
          <span class="value">{{ requestedBy }}</span>
        </ion-col>
        <ion-col size="6">
          <span class="label">{{ $t("user.uniform_request.transaction_date") }}</span>
          <span class="value">{{ today }}</span>
        </ion-col>
      </ion-row>

      <div class="field">
        <span class="label">{{ $t("user.uniform_request.required_date") }}</span>
        <Datepicker v-model="requiredDate" :min-date="new Date()" />
        <span class="hint">{{ $t("user.uniform_request.required_date_hint") }}</span>
      </div>

      <h2 class="section">{{ $t("user.uniform_request.items") }}</h2>

      <ion-spinner v-if="isLoading" />

      <div v-for="(row, index) in rows" :key="index" class="item-row">
        <ion-row class="item-row-head">
          <ion-col>
            <span class="label">{{ $t("user.uniform_request.item") }} {{ index + 1 }}</span>
          </ion-col>
          <ion-col v-if="rows.length > 1" class="ion-text-end">
            <ion-button fill="clear" size="small" color="danger" @click="removeRow(index)">
              {{ $t("user.uniform_request.remove_item") }}
            </ion-button>
          </ion-col>
        </ion-row>

        <ion-select
          v-model="row.item_code"
          interface="action-sheet"
          :placeholder="$t('user.uniform_request.select_item')"
          @ion-change="clearError(index, 'item')"
        >
          <ion-select-option
            v-for="option in itemOptions"
            :key="option.item_code"
            :value="option.item_code"
          >
            {{ option.item_name }}
          </ion-select-option>
        </ion-select>
        <ion-text v-if="errorFor(index, 'item')" color="danger" class="error">
          {{ errorFor(index, "item") }}
        </ion-text>

        <ion-input
          v-model="row.size"
          :label="$t('user.uniform_request.size')"
          label-placement="stacked"
          :placeholder="$t('user.uniform_request.size_placeholder')"
          @ion-input="clearError(index, 'size')"
        />
        <ion-text v-if="errorFor(index, 'size')" color="danger" class="error">
          {{ errorFor(index, "size") }}
        </ion-text>

        <div class="photo">
          <span class="label">{{ $t("user.uniform_request.photo") }}</span>
          <input
            :id="`uniform-photo-${index}`"
            type="file"
            accept="image/jpeg,image/png"
            capture="environment"
            class="photo-input"
            @change="onPhotoPicked($event, index)"
          />
          <label :for="`uniform-photo-${index}`" class="photo-button">
            {{
              row.photoName
                ? $t("user.uniform_request.change_photo")
                : $t("user.uniform_request.take_photo")
            }}
          </label>
          <span v-if="row.photoName" class="photo-name">{{ row.photoName }}</span>
        </div>
        <ion-text v-if="errorFor(index, 'photo')" color="danger" class="error">
          {{ errorFor(index, "photo") }}
        </ion-text>
      </div>

      <ion-button expand="block" fill="outline" @click="addRow">
        {{ $t("user.uniform_request.add_item") }}
      </ion-button>

      <ion-button expand="block" :disabled="isSubmitting" @click="onSubmit">
        <ion-spinner v-if="isSubmitting" name="crescent" />
        <span v-else>{{ $t("user.uniform_request.submit") }}</span>
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
.subtitle {
  color: var(--ion-color-medium);
  font-size: 13px;
  margin: 4px 0 12px;
}

.summary {
  margin-bottom: 12px;
}

.label {
  display: block;
  font-size: 12px;
  color: var(--ion-color-medium);
}

.value {
  font-size: 14px;
  font-weight: 600;
}

.hint {
  display: block;
  font-size: 11px;
  color: var(--ion-color-medium);
  margin-top: 2px;
}

.field {
  margin-bottom: 12px;
}

.section {
  font-size: 15px;
  font-weight: 600;
  margin: 16px 0 8px;
}

.item-row {
  border: 1px solid var(--ion-color-light-shade);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.item-row-head {
  align-items: center;
}

.error {
  display: block;
  font-size: 12px;
  margin: 2px 0 6px;
}

.photo {
  margin-top: 8px;
}

.photo-input {
  display: none;
}

.photo-button {
  display: inline-block;
  margin-top: 4px;
  padding: 8px 14px;
  border: 1px dashed var(--ion-color-medium);
  border-radius: 6px;
  font-size: 13px;
}

.photo-name {
  display: block;
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-top: 4px;
  word-break: break-all;
}
</style>
