<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute } from "vue-router";
import {
  IonPage,
  IonContent,
  IonLabel,
  IonRow,
  IonCol,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonText,
  IonSpinner,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonSearchbar,
  useIonRouter,
  toastController,
} from "@ionic/vue";
import { useI18n } from "vue-i18n";
import dayjs from "dayjs";
import LeavesHeader from "@/components/leaves/Header.vue";
import stockEntryApi from "@/api/stock_entry";
import { useStockEntryStore } from "@/store/stock_entry";
import { useLangStore } from "@/store/lang.js";
import IconClose from "@/components/icon/Close.vue";
import ArrowRight from "@/components/icon/ArrowRight.vue";

const { t } = useI18n();
const route = useRoute();
const ionRouter = useIonRouter();
const langStore = useLangStore();
const stockEntryStore = useStockEntryStore();

const stockEntryId = route.params.id;
const stockEntry = ref(null);
const stockBalances = ref({});
const isLoading = ref(true);
const isSaving = ref(false);
const isSubmitting = ref(false);

const isItemModalOpen = ref(false);
const itemSearchQuery = ref("");
const activeItemIndex = ref(-1);

const itemOptions = computed(() => {
  if (!itemSearchQuery.value || itemSearchQuery.value.trim() === "") {
    return stockEntryStore.items.slice(0, 20);
  }
  const query = itemSearchQuery.value.toLowerCase();
  return stockEntryStore.items.filter(item => 
    item.item_code.toLowerCase().includes(query) || 
    item.item_name.toLowerCase().includes(query)
  ).slice(0, 20); // Limit results for performance
});

const isUomModalOpen = ref(false);
const uomSearchQuery = ref("");
const activeUomIndex = ref(-1);

const uomOptions = computed(() => {
  if (!uomSearchQuery.value || uomSearchQuery.value.trim() === "") {
    return stockEntryStore.uoms.slice(0, 20);
  }
  const query = uomSearchQuery.value.toLowerCase();
  return stockEntryStore.uoms.filter(uom => 
    uom.name.toLowerCase().includes(query)
  ).slice(0, 20); // Limit results for performance
});

const isDraft = computed(() => stockEntry.value?.docstatus === 0);
const isSubmitted = computed(() => stockEntry.value?.docstatus === 1);
const isMaterialTransfer = computed(() => stockEntry.value?.stock_entry_type === "Material Transfer");

const fetchData = async () => {
  isLoading.value = true;
  try {
    stockEntryStore.fetchWarehouses();
    stockEntryStore.fetchStockItems();
    stockEntryStore.fetchUoms();
    const { data: detailData } = await stockEntryApi.getStockEntryDetail(stockEntryId);
    stockEntry.value = detailData.message;

    // Prefetch stock balances
    const itemCodes = stockEntry.value.items.map((i) => i.item_code);
    const warehouses = [stockEntry.value.from_warehouse];
    if (stockEntry.value.to_warehouse) {
      warehouses.push(stockEntry.value.to_warehouse);
    }
    
    if (itemCodes.length > 0 && warehouses.length > 0) {
      const { data: balanceData } = await stockEntryApi.getWarehouseStockBalances(itemCodes, warehouses);
      stockBalances.value = balanceData.message || {};
    }
  } catch (error) {
    console.error("Failed to fetch stock entry details:", error);
    showToast(t("utils.error_fetching_data"), "danger");
  } finally {
    isLoading.value = false;
  }
};

const getAvailableQty = (itemCode, warehouse) => {
  return stockBalances.value[warehouse]?.[itemCode] || 0;
};

const isValidated = computed(() => {
  if (!stockEntry.value) return true;
  return stockEntry.value.items.every((item) => {
    const available = getAvailableQty(item.item_code, stockEntry.value.from_warehouse);
    return item.qty <= available;
  });
});

const showToast = async (message, color = "success") => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color,
    position: "bottom",
  });
  await toast.present();
};

const handleSave = async () => {
  if (!isValidated.value) {
    showToast(t("user.stock_entry.insufficient_stock"), "danger");
    return;
  }
  isSaving.value = true;
  try {
    const payload = { ...stockEntry.value };
    payload.items = payload.items.map(item => {
      const { is_new, ...rest } = item;
      return rest;
    });
    
    await stockEntryApi.updateStockEntry(stockEntry.value.name, payload);
    showToast(t("utils.save_success"));
    triggerBack();
  } catch (error) {
    console.error("Save error:", error);
    showToast(t("utils.save_error"), "danger");
  } finally {
    isSaving.value = false;
  }
};

const handleSubmit = async () => {
  if (!isValidated.value) {
    showToast(t("user.stock_entry.insufficient_stock"), "danger");
    return;
  }
  isSubmitting.value = true;
  try {
    const payload = { ...stockEntry.value };
    payload.items = payload.items.map(item => {
      const { is_new, ...rest } = item;
      return rest;
    });
    
    // Save draft first
    const response = await stockEntryApi.updateStockEntry(stockEntry.value.name, payload);
    const updatedDoc = response.data.data;
    
    // Submit
    await stockEntryApi.submitStockEntry(updatedDoc);
    
    showToast(t("utils.submit_success"));
    stockEntry.value.docstatus = 1;
    triggerBack();
  } catch (error) {
    console.error("Submit error:", error);
    showToast(t("utils.submit_error"), "danger");
  } finally {
    isSubmitting.value = false;
  }
};

const handleAddItem = () => {
  if (!stockEntry.value) return;
  stockEntry.value.items.push({
    item_code: "",
    item_name: "",
    qty: 0,
    uom: "",
    stock_uom: "",
    is_new: true,
  });
};

const removeItem = (index) => {
  stockEntry.value.items.splice(index, 1);
};

const openItemSelector = (index) => {
  activeItemIndex.value = index;
  isItemModalOpen.value = true;
  itemSearchQuery.value = "";
};

const selectItem = async (item) => {
  const targetItem = stockEntry.value.items[activeItemIndex.value];
  targetItem.item_code = item.item_code;
  targetItem.item_name = item.item_name;
  targetItem.stock_uom = item.stock_uom;
  targetItem.uom = item.stock_uom;
  
  // Fetch stock balance for new item
  try {
    const warehouses = [stockEntry.value.from_warehouse];
    if (stockEntry.value.to_warehouse) warehouses.push(stockEntry.value.to_warehouse);
    
    const { data } = await stockEntryApi.getWarehouseStockBalances([item.item_code], warehouses);
    const newBalances = data.message || {};
    
    // Merge into existing balances
    for (const wh in newBalances) {
      if (!stockBalances.value[wh]) stockBalances.value[wh] = {};
      stockBalances.value[wh][item.item_code] = newBalances[wh][item.item_code];
    }
  } catch (error) {
    console.error("Failed to fetch balance for selected item:", error);
  }

  isItemModalOpen.value = false;
};

const openUomSelector = (index) => {
  activeUomIndex.value = index;
  isUomModalOpen.value = true;
  uomSearchQuery.value = "";
};

const selectUom = (uom) => {
  const targetItem = stockEntry.value.items[activeUomIndex.value];
  targetItem.uom = uom.name;
  isUomModalOpen.value = false;
};

const triggerBack = () => {
  ionRouter.back();
};

const handleTypeChange = (e) => {
  if (stockEntry.value && e.detail.value === "Material Issue") {
    stockEntry.value.to_warehouse = null;
  }
};

watch(() => stockEntry.value?.from_warehouse, async (newVal, oldVal) => {
  if (!newVal || newVal === oldVal) return;
  if (!stockEntry.value?.items?.length) return;
  const itemCodes = stockEntry.value.items.filter(i => i.item_code).map(i => i.item_code);
  if (!itemCodes.length) return;
  try {
    const { data } = await stockEntryApi.getWarehouseStockBalances(itemCodes, [newVal]);
    const newBalances = data.message || {};
    for (const wh in newBalances) {
      if (!stockBalances.value[wh]) stockBalances.value[wh] = {};
      for (const itemCode in newBalances[wh]) {
        stockBalances.value[wh][itemCode] = newBalances[wh][itemCode];
      }
    }
  } catch (err) {
    console.error("Failed to fetch balance for new warehouse", err);
  }
});

onMounted(fetchData);
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding stock-detail-page">
      <LeavesHeader
        class="stock-detail-header"
        :title="stockEntryId"
        show-back-button
        @click-back="triggerBack"
      />

      <div v-if="isLoading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent"></ion-spinner>
      </div>

      <div v-else-if="stockEntry" class="stock-detail-content">
        <!-- Header Info -->
        <div class="info-section">
          <ion-row class="info-row">
            <ion-col size="6">
              <ion-text color="medium" class="label">{{ t("user.stock_entry.type") }}</ion-text>
              <ion-select
                v-if="isDraft"
                v-model="stockEntry.stock_entry_type"
                fill="outline"
                class="warehouse-input"
                interface="alert"
                @ionChange="handleTypeChange"
              >
                <ion-select-option value="Material Issue">Material Issue</ion-select-option>
                <ion-select-option value="Material Transfer">Material Transfer</ion-select-option>
              </ion-select>
              <p v-else class="value">{{ stockEntry.stock_entry_type }}</p>
            </ion-col>
            <ion-col size="6">
              <ion-text color="medium" class="label">{{ t("user.stock_entry.date") }}</ion-text>
              <p class="value">{{ dayjs(stockEntry.posting_date).format("DD MMM, YYYY") }}</p>
            </ion-col>
          </ion-row>

          <ion-row class="info-row">
            <ion-col :size="isMaterialTransfer ? 6 : 12">
              <ion-text color="medium" class="label">{{ t("user.stock_entry.source_warehouse") }}</ion-text>
              <ion-select
                v-if="isDraft"
                v-model="stockEntry.from_warehouse"
                fill="outline"
                class="warehouse-input"
                interface="alert"
              >
                <ion-select-option
                  v-for="wh in stockEntryStore.warehouses"
                  :key="wh.name"
                  :value="wh.name"
                  :disabled="wh.name === stockEntry.to_warehouse"
                >
                  {{ wh.name }}
                </ion-select-option>
              </ion-select>
              <p v-else class="value">{{ stockEntry.from_warehouse }}</p>
            </ion-col>
            <ion-col v-if="isMaterialTransfer" size="6">
              <ion-text color="medium" class="label">{{ t("user.stock_entry.target_warehouse") }}</ion-text>
              <ion-select
                v-if="isDraft"
                v-model="stockEntry.to_warehouse"
                fill="outline"
                class="warehouse-input"
                interface="alert"
                :disabled="!stockEntry.from_warehouse"
              >
                <ion-select-option
                  v-for="wh in stockEntryStore.warehouses"
                  :key="wh.name"
                  :value="wh.name"
                  :disabled="wh.name === stockEntry.from_warehouse"
                >
                  {{ wh.name }}
                </ion-select-option>
              </ion-select>
              <p v-else class="value">{{ stockEntry.to_warehouse }}</p>
            </ion-col>
          </ion-row>

          <ion-row class="info-row">
            <ion-col size="12">
              <ion-text color="medium" class="label">{{ t("user.stock_entry.site_supervisor") }}</ion-text>
              <p class="value">{{ stockEntry.custom_site_supervisor_name || stockEntry.custom_site_supervisor || '-' }}</p>
            </ion-col>
          </ion-row>
        </div>

        <!-- Items Table -->
        <div class="items-section">
          <div class="section-header">
            <h2 class="section-title">{{ t("user.stock_entry.items") }}</h2>
          </div>

          <div class="items-list">
            <div
              v-for="(item, index) in stockEntry.items"
              :key="item.name || index"
              class="item-row"
              :class="{ 
                'stock-error': isDraft && item.item_code && item.qty > getAvailableQty(item.item_code, stockEntry.from_warehouse),
                'new-item': item.is_new
              }"
            >
              <ion-row class="ion-align-items-center">
                <ion-col size="10" @click="isDraft && !item.item_code ? openItemSelector(index) : null">
                  <template v-if="item.item_code">
                    <p class="item-name">{{ item.item_name }}</p>
                    <p class="item-code">{{ item.item_code }}</p>
                  </template>
                  <div v-else class="item-placeholder">
                    <ion-text color="primary">{{ t("user.stock_entry.select_item") }}</ion-text>
                  </div>
                </ion-col>
                <ion-col size="2" class="ion-text-right">
                  <ion-button v-if="isDraft && item.is_new" fill="clear" color="danger" @click="removeItem(index)">
                    <IconClose />
                  </ion-button>
                </ion-col>
              </ion-row>

              <ion-row v-if="item.item_code" class="qty-row ion-align-items-center">
                <ion-col size="4">
                  <ion-text class="qty-label">{{ t("user.stock_entry.available") }}:</ion-text>
                  <span class="qty-value">{{ getAvailableQty(item.item_code, stockEntry.from_warehouse) }}</span>
                </ion-col>
                <ion-col size="5">
                  <div class="input-wrapper" @click="isDraft ? openUomSelector(index) : null">
                    <ion-text class="qty-label">UOM:</ion-text>
                    <ion-input
                      type="text"
                      :value="item.uom || 'Select'"
                      readonly
                      class="qty-input uom-input clickable-input"
                      fill="outline"
                    ></ion-input>
                  </div>
                </ion-col>
                <ion-col size="3">
                  <div class="input-wrapper">
                    <ion-text class="qty-label">Qty:</ion-text>
                    <ion-input
                      type="number"
                      v-model="item.qty"
                      :readonly="!isDraft"
                      class="qty-input"
                      fill="outline"
                    ></ion-input>
                  </div>
                </ion-col>
              </ion-row>
              <p v-if="isDraft && item.item_code && item.qty > getAvailableQty(item.item_code, stockEntry.from_warehouse)" class="error-msg">
                {{ t("user.stock_entry.insufficient_stock") }}
              </p>
            </div>
          </div>

          <!-- Move Add Button Here -->
          <div v-if="isDraft" class="add-item-wrapper ion-text-center">
            <ion-button fill="clear" color="primary" class="add-item-btn" @click="handleAddItem">
              + {{ t("utils.add") }}
            </ion-button>
          </div>
        </div>
      </div>

      <!-- Item Selection Modal -->
      <ion-modal :is-open="isItemModalOpen" @did-dismiss="isItemModalOpen = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ t("user.stock_entry.select_item") }}</ion-title>
            <ion-button slot="end" fill="clear" @click="isItemModalOpen = false">
              {{ t("utils.cancel") }}
            </ion-button>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-searchbar
            v-model="itemSearchQuery"
            :placeholder="t('user.stock_entry.search_item_placeholder')"
            debounce="300"
          />
          <ion-list>
            <ion-item
              v-for="item in itemOptions"
              :key="item.item_code"
              button
              @click="selectItem(item)"
            >
              <ion-label>
                <h2>{{ item.item_name }}</h2>
                <p>{{ item.item_code }}</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>

      <!-- UOM Selection Modal -->
      <ion-modal :is-open="isUomModalOpen" @did-dismiss="isUomModalOpen = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Select UOM</ion-title>
            <ion-button slot="end" fill="clear" @click="isUomModalOpen = false">
              {{ t("utils.cancel") }}
            </ion-button>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-searchbar
            v-model="uomSearchQuery"
            placeholder="Search UOM..."
            debounce="300"
          />
          <ion-list>
            <ion-item
              v-for="uom in uomOptions"
              :key="uom.name"
              button
              @click="selectUom(uom)"
            >
              <ion-label>
                <h2>{{ uom.name }}</h2>
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>

      <!-- Action Buttons -->
      <div v-if="isDraft" class="footer-actions">
        <ion-row>
          <ion-col size="6">
            <ion-button expand="block" fill="outline" color="primary" @click="handleSave" :disabled="isSaving || !isValidated">
              <ion-spinner v-if="isSaving" name="crescent"></ion-spinner>
              <template v-else>{{ t("utils.save") }}</template>
            </ion-button>
          </ion-col>
          <ion-col size="6">
            <ion-button expand="block" color="primary" @click="handleSubmit" :disabled="isSubmitting || !isValidated">
              <ion-spinner v-if="isSubmitting" name="crescent"></ion-spinner>
              <template v-else>{{ t("utils.submit") }}</template>
            </ion-button>
          </ion-col>
        </ion-row>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped lang="scss">
.stock-detail-page {
  --background: #191c1d;
  
  .stock-detail-header {
    background: #191c1d;
    position: sticky;
    top: 0;
    z-index: 10;
  }
}

.info-section {
  background: #1e2529;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  border: 1px solid #364955;

  .info-row {
    margin-bottom: 12px;
    &:last-child { margin-bottom: 0; }
  }

  .label {
    font-size: 0.75rem;
    display: block;
    margin-bottom: 4px;
  }

  .value {
    color: #e0e3e3;
    font-weight: 500;
    margin: 0;
  }

  .warehouse-input {
    --padding-start: 8px;
    --padding-end: 8px;
    --background: transparent;
    --color: #e0e3e3;
    font-size: 0.9rem;
    margin-top: 4px;
  }
}

.items-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #e0e3e3;
      margin: 0;
    }
  }

  .item-row {
    background: #1e2529;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    border: 1px solid #364955;
    transition: all 0.2s ease;

    &.stock-error {
      border-color: var(--ion-color-danger);
      background: rgba(var(--ion-color-danger-rgb), 0.1);
    }

    .item-name {
      font-weight: 600;
      color: #e0e3e3;
      margin: 0;
    }
    
    .item-code {
      font-size: 0.8rem;
      color: #8b9298;
      margin: 4px 0 0;
    }

    .uom {
      font-size: 0.8rem;
    }

    .qty-row {
      margin-top: 16px;
      
      .qty-label {
        font-size: 0.85rem;
        color: #8b9298;
        margin-right: 8px;
      }
      
      .qty-value {
        color: #e0e3e3;
        font-weight: 500;
      }

      .qty-input {
        --padding-start: 8px;
        --padding-end: 8px;
        --background: transparent;
        --color: #e0e3e3;
        font-size: 0.9rem;
        text-align: right;
      }
    }

    .error-msg {
      color: var(--ion-color-danger);
      font-size: 0.75rem;
      margin-top: 8px;
      margin-bottom: 0;
    }

    .item-placeholder {
      padding: 12px 0;
      border: 1px dashed #364955;
      border-radius: 8px;
      text-align: center;
      cursor: pointer;
    }

    &.new-item {
      border-color: var(--ion-color-primary);
      background: rgba(var(--ion-color-primary-rgb), 0.05);
    }
  }

  .add-item-wrapper {
    margin-top: 16px;
    padding-bottom: 80px; // Ensure space above fixed footer
  }
}

.footer-actions {
  position: sticky;
  bottom: 0;
  background: #191c1d;
  padding: 16px 0;
  z-index: 10;
  border-top: 1px solid #2c353a;
}
</style>
