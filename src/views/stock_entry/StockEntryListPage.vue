<script setup>
import {
  IonButton,
  IonContent,
  IonPage,
  IonText,
  IonRow,
  IonLabel,
  IonModal,
  IonCol,
  IonCheckbox,
  IonInput,
  useIonRouter,
  onIonViewWillEnter,
} from "@ionic/vue";
import LeavesHeader from "@/components/leaves/Header.vue";
import { ref, computed, shallowRef } from "vue";
import { useStockEntryStore } from "@/store/stock_entry";
import { useCustomToast } from "@/composable/toast.js";
import { useI18n } from "vue-i18n";
import Datepicker from "@/components/base/Datepicker.vue";
import { useLangStore } from "@/store/lang.js";
import useDateHelper from "@/composable/useDateHelper";
import IconClose from "@/components/icon/Close.vue";
import IconPlus from "@/components/icon/Plus.vue";
import ArrowRight from "@/components/icon/ArrowRight.vue";
import IconCheck from "@/components/icon/Check.vue";
import IconAccountClock from "@/components/icon/AccountClock.vue";

const router = useIonRouter();
const stockEntryStore = useStockEntryStore();
const { showErrorToast } = useCustomToast();
const { formatDate, dayjs } = useDateHelper();
const { t } = useI18n();
const langStore = useLangStore();

const openFilter = ref(false);
const isFromDatePickerOpen = shallowRef(false);
const isToDatePickerOpen = shallowRef(false);

const stockEntries = computed(() => stockEntryStore.stockEntries);

const fetchStockEntries = async () => {
  try {
    await stockEntryStore.fetchStockEntries();
  } catch (error) {
    showErrorToast(
      error?.data?.message || t("utils.error_fetching_data"),
      error?.data?.error,
      error?.status
    );
  }
};

onIonViewWillEnter(async () => {
  await fetchStockEntries();
  stockEntryStore.fetchStockItems(); // Prefetch items for search cache
});

const triggerBack = () => {
  router.push("/home");
};

const onDismiss = () => {
  openFilter.value = false;
};

const resetFilters = () => {
  stockEntryStore.resetFilters();
  fetchStockEntries();
  openFilter.value = false;
};

const applyFilters = () => {
  fetchStockEntries();
  openFilter.value = false;
};

const setStockEntryType = (event, type) => {
  if (event.detail.checked) {
    if (!stockEntryStore.filters.stock_entry_type.includes(type)) {
      stockEntryStore.filters.stock_entry_type.push(type);
    }
  } else {
    stockEntryStore.filters.stock_entry_type = stockEntryStore.filters.stock_entry_type.filter(t => t !== type);
  }
};

const formatDateToDisplay = (date, format = "DD-MM-YYYY") => {
  return dayjs(date).format(format);
};
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding stock-entry-page">
      <LeavesHeader
        class="stock-entry-header"
        :title="t('user.stock_entry.title')"
        show-filter-button
        @open-filters="openFilter = true"
        @click-back="triggerBack"
      />

      <div class="stock-entry-wrapper">
        <div v-if="stockEntryStore.isLoading" class="ion-text-center ion-padding">
          <ion-label>{{ t("utils.loading") }}...</ion-label>
        </div>
        
        <template v-else>
          <div v-if="stockEntries.length === 0" class="ion-text-center ion-padding">
            <ion-text color="medium">
              <p>{{ t("user.stock_entry.no_records_found") }}</p>
            </ion-text>
          </div>

          <ion-row
            v-for="entry in stockEntries"
            :key="entry.name"
            class="stock-entry ion-align-items-center ion-justify-content-between"
            @click="router.push(`/stock-entry/${entry.name}`)"
          >
            <ion-row class="stock-entry-content ion-align-items-center">
              <ion-col size="3">
                <div class="stock-entry-icon-wrapper">
                  <IconCheck
                    v-if="entry.docstatus === 1"
                    class="stock-entry-icon stock-entry-status__submitted"
                  />
                  <IconAccountClock
                    v-else
                    class="stock-entry-icon stock-entry-status__draft"
                  />
                  <p class="stock-entry-type-small">
                    {{ entry.stock_entry_type }}
                  </p>
                </div>
              </ion-col>
              <div class="stock-entry-content-wrapper">
                <p class="stock-entry-label-white">
                  <span class="stock-entry-id">{{ entry.name }}</span>
                </p>
                <p class="stock-entry-label-white">
                  <span class="stock-entry-label">{{ t("user.stock_entry.source_warehouse") }}:</span>
                  {{ entry.from_warehouse || '-' }}
                </p>
                <p v-if="entry.stock_entry_type === 'Material Transfer'" class="stock-entry-label-white">
                  <span class="stock-entry-label">{{ t("user.stock_entry.target_warehouse") }}:</span>
                  {{ entry.to_warehouse || '-' }}
                </p>
                <p class="stock-entry-label-white">
                  <span class="stock-entry-label">{{ t("user.stock_entry.date") }}:</span>
                  {{ formatDateToDisplay(entry.posting_date, "DD MMM, YYYY") }}
                </p>
              </div>
            </ion-row>
            <ion-button fill="clear" class="stock-entry-redirect-button" @click.stop="router.push(`/stock-entry/${entry.name}`)">
              <ArrowRight />
            </ion-button>
          </ion-row>
        </template>
      </div>

      <!-- Filter Modal -->
      <ion-modal
        :is-open="openFilter"
        :initial-breakpoint="0.85"
        class="stock-filter-modal"
        :breakpoints="[0, 0.85]"
        @didDismiss="onDismiss"
      >
        <div class="stock-filter-modal-content">
          <ion-row class="ion-justify-content-between ion-align-items-center">
            <ion-row class="ion-align-items-center">
              <ion-button fill="clear" color="light" class="stock-filter-modal-close-button" @click="openFilter = false">
                <IconClose />
              </ion-button>
              <p>{{ t("utils.filter") }}</p>
            </ion-row>
            <ion-button fill="clear" @click="resetFilters">
              {{ t("utils.reset") }}
            </ion-button>
          </ion-row>

          <ion-row class="ion-margin-top">
            <ion-col size="6">
              <p class="stock-filter-label">{{ t("user.stock_entry.from_date") }}</p>
              <ion-input
                fill="outline"
                readonly
                :value="formatDate(stockEntryStore.filters.from_date, 'DD-MM-YYYY')"
                @ion-focus="isFromDatePickerOpen = true"
              />
            </ion-col>
            <ion-col size="6">
              <p class="stock-filter-label">{{ t("user.stock_entry.to_date") }}</p>
              <ion-input
                fill="outline"
                readonly
                :value="formatDate(stockEntryStore.filters.to_date, 'DD-MM-YYYY')"
                @ion-focus="isToDatePickerOpen = true"
              />
            </ion-col>
          </ion-row>

          <Datepicker
            :lang="langStore.lang"
            :is-open="isFromDatePickerOpen"
            v-model="stockEntryStore.filters.from_date"
            @cancel="isFromDatePickerOpen = false"
            @ok="isFromDatePickerOpen = false"
          />
          <Datepicker
            :lang="langStore.lang"
            :is-open="isToDatePickerOpen"
            v-model="stockEntryStore.filters.to_date"
            @cancel="isToDatePickerOpen = false"
            @ok="isToDatePickerOpen = false"
          />

          <div class="ion-margin-top">
            <p class="stock-filter-checkbox-list-title">{{ t("user.stock_entry.stock_entry_type") }}</p>
            <div class="stock-filter-checkbox-list">
              <ion-checkbox
                :checked="stockEntryStore.filters.stock_entry_type.includes('Material Transfer')"
                @ionChange="setStockEntryType($event, 'Material Transfer')"
              >
                {{ t("user.stock_entry.material_transfer") }}
              </ion-checkbox>
              <ion-checkbox
                :checked="stockEntryStore.filters.stock_entry_type.includes('Material Issue')"
                @ionChange="setStockEntryType($event, 'Material Issue')"
              >
                {{ t("user.stock_entry.material_issue") }}
              </ion-checkbox>
            </div>
          </div>

          <ion-button expand="block" shape="round" class="ion-margin-top apply-btn" @click="applyFilters">
            {{ t("utils.apply") }}
          </ion-button>
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<style scoped lang="scss">
.stock-entry-page {
  --padding-top: 0;
  --padding-bottom: 24px;
  --padding-start: 0;
  --padding-end: 0;

  &-header {
    position: sticky;
    top: 0;
    padding: 0 15px;
    z-index: 10;
    background: #191c1d;
  }
}

.stock-entry-wrapper {
  margin-top: 26px;
}

.stock-entry {
  border-bottom: 1px solid var(--ion-color-medium-shade);
  padding: 12px 8px;
  margin-bottom: 4px;
  gap: 12px;
  flex-wrap: nowrap;

  &-icon-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  &-icon {
    width: 40px;
    height: 40px;
  }

  &-type-small {
    margin: 4px 0 0;
    font-size: 0.7rem;
    line-height: 1rem;
    color: #b5c9d7;
    font-weight: 500;
  }

  &-content {
    flex-wrap: nowrap;
    gap: 12px;
    flex-grow: 1;
  }

  &-label {
    font-size: 0.75rem;
    color: #8b9298;
    &-white {
      margin: 4px 0 0;
      &:first-child {
        margin-top: 0;
      }
      font-size: 0.75rem;
      color: #e0e3e3;
    }
  }

  &-id {
    font-weight: 600;
    color: #d1e5f3;
  }

  &-redirect-button {
    --color: #d9d9d9;
  }
}

.stock-entry-status__submitted {
  color: #52e169;
}
.stock-entry-status__draft {
  color: #76d1ff;
}

.stock-filter-modal {
  &::part(content) {
    border-radius: 28px 28px 0 0;
    background: #1e2529;
  }
  &-content {
    padding: 16px;
  }
  &-close-button {
    --padding-start: 0;
  }
}

.stock-filter-label {
  color: #c0c7cd;
  font-size: 0.875rem;
  margin-bottom: 8px;
}

.stock-filter-checkbox-list-title {
  margin: 16px 0 8px;
  color: #e0e3e3;
}

.stock-filter-checkbox-list {
  display: flex;
  flex-direction: column;
  ion-checkbox {
    padding: 12px 0;
  }
}

.apply-btn {
  --background: #364955;
  --color: #d1e5f3;
  --border-radius: 100px;
  font-weight: 600;
  margin-top: 32px;
}
</style>
