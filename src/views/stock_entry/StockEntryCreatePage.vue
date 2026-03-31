<script setup>
import { ref, onMounted, computed, watch } from "vue";
import {
  IonPage,
  IonContent,
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
  IonLabel,
  useIonRouter,
  toastController,
} from "@ionic/vue";
import { useI18n } from "vue-i18n";
import dayjs from "dayjs";
import LeavesHeader from "@/components/leaves/Header.vue";
import stockEntryApi from "@/api/stock_entry";
import { useStockEntryStore } from "@/store/stock_entry";
import { useUserStore } from "@/store/user.js";
import { useAuthStore } from "@/store/auth.js";
import IconClose from "@/components/icon/Close.vue";

const { t } = useI18n();
const ionRouter = useIonRouter();
const stockEntryStore = useStockEntryStore();
const userStore = useUserStore();
const authStore = useAuthStore();

const stockEntry = ref({
  doctype: "Stock Entry",
  stock_entry_type: "Material Transfer",
  from_warehouse: "",
  to_warehouse: "",
  custom_site_supervisor_name: "",
  items: [],
});

const stockBalances = ref({});
const isLoading = ref(true);
const isSaving = ref(false);

const isItemModalOpen = ref(false);
const itemSearchQuery = ref("");
const activeItemIndex = ref(-1);

const isUomModalOpen = ref(false);
const uomSearchQuery = ref("");
const activeUomIndex = ref(-1);

const isWarehouseModalOpen = ref(false);
const warehouseSearchQuery = ref("");
const activeWarehouseField = ref(""); // 'from_warehouse' or 'to_warehouse'

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

const uomOptions = computed(() => {
  if (!uomSearchQuery.value || uomSearchQuery.value.trim() === "") {
    return stockEntryStore.uoms.slice(0, 20);
  }
  const query = uomSearchQuery.value.toLowerCase();
  return stockEntryStore.uoms.filter(uom => 
    uom.name.toLowerCase().includes(query)
  ).slice(0, 20); // Limit results for performance
});

const warehouseOptions = computed(() => {
  let list = stockEntryStore.warehouses;
  // Filter out the other warehouse to prevent picking same for from/to
  if (activeWarehouseField.value === "from_warehouse") {
    list = list.filter(w => w.name !== stockEntry.value.to_warehouse);
  } else if (activeWarehouseField.value === "to_warehouse") {
    list = list.filter(w => w.name !== stockEntry.value.from_warehouse);
  }

  if (!warehouseSearchQuery.value || warehouseSearchQuery.value.trim() === "") {
    return list.slice(0, 20);
  }
  const query = warehouseSearchQuery.value.toLowerCase();
  return list.filter(w => 
    w.name.toLowerCase().includes(query)
  ).slice(0, 20);
});

const isMaterialTransfer = computed(() => stockEntry.value.stock_entry_type === "Material Transfer");

const fetchData = async () => {
  isLoading.value = true;
  try {
    stockEntryStore.fetchWarehouses();
    stockEntryStore.fetchStockItems();
    stockEntryStore.fetchUoms();
  } catch (error) {
    console.error("Failed to fetch requirements:", error);
    showToast(t("utils.error_fetching_data", "Error fetching data"), "danger");
  } finally {
    isLoading.value = false;
  }
};

const getAvailableQty = (itemCode, warehouse) => {
  return stockBalances.value[warehouse]?.[itemCode] || 0;
};

const showToast = async (message, color = "success", duration = 4000) => {
  const toast = await toastController.create({
    message,
    duration,
    color,
    position: "bottom",
  });
  await toast.present();
};

const handleSave = async () => {
  // Missing Fields Validation
  if (!stockEntry.value.stock_entry_type || !stockEntry.value.from_warehouse) {
    showToast("Please fill in all required fields", "danger");
    return;
  }
  if (isMaterialTransfer.value && !stockEntry.value.to_warehouse) {
    showToast("Please fill in all required fields", "danger");
    return;
  }
  
  if (stockEntry.value.items.length === 0) {
    showToast("Please add at least one item", "danger");
    return;
  }

  for (const item of stockEntry.value.items) {
    if (!item.item_code || !item.qty || item.qty <= 0 || !item.uom) {
      showToast("Please fill in all required fields", "danger");
      return;
    }
  }

  // Quantity Validation
  for (const item of stockEntry.value.items) {
    const available = getAvailableQty(item.item_code, stockEntry.value.from_warehouse);
    if (item.qty > available) {
      showToast("Quantity cannot exceed Current Quantity", "danger");
      return;
    }
  }

  isSaving.value = true;
  try {
    const payload = { ...stockEntry.value };
    // Ensure nested items don't have is_new flag when sending to backend
    payload.items = payload.items.map(item => {
      const { is_new, ...rest } = item;
      return rest;
    });

    const { data } = await stockEntryApi.createStockEntry(payload);
    // Standard response struct: data.data.name is the docname
    const newDocId = data.data.name; 
    
    showToast("Success! Your Stock Entry has been Saved.", "success");
    ionRouter.replace(`/stock-entry/${newDocId}`);
  } catch (error) {
    console.error("Creation error:", error);
    showToast(t("utils.save_error", "An error occurred while saving"), "danger");
  } finally {
    isSaving.value = false;
  }
};

const handleAddItem = () => {
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
  
  try {
    const warehouses = [stockEntry.value.from_warehouse];
    if (stockEntry.value.to_warehouse) warehouses.push(stockEntry.value.to_warehouse);
    
    const { data } = await stockEntryApi.getWarehouseStockBalances([item.item_code], warehouses);
    const newBalances = data.data || {};
    
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
  if (e.detail.value === "Material Issue") {
    stockEntry.value.to_warehouse = "";
  }
};

const openWarehouseSelector = (fieldName) => {
  if (fieldName === "to_warehouse" && !stockEntry.value.from_warehouse) {
    showToast("Please select Source Warehouse first", "warning");
    return;
  }
  activeWarehouseField.value = fieldName;
  isWarehouseModalOpen.value = true;
  warehouseSearchQuery.value = "";
};

const selectWarehouse = (warehouse) => {
  stockEntry.value[activeWarehouseField.value] = warehouse.name;
  isWarehouseModalOpen.value = false;
};

watch(() => stockEntry.value.from_warehouse, async (newVal, oldVal) => {
  if (!newVal || newVal === oldVal) return;
  const itemCodes = stockEntry.value.items.filter(i => i.item_code).map(i => i.item_code);
  if (!itemCodes.length) return;
  try {
    const { data } = await stockEntryApi.getWarehouseStockBalances(itemCodes, [newVal]);
    const newBalances = data.data || {};
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

watch(() => userStore.user, (newUser) => {
  if (newUser && !stockEntry.value.custom_site_supervisor_name) {
    stockEntry.value.custom_site_supervisor_name = newUser.full_name || authStore.userName || "";
  }
}, { immediate: true });

onMounted(fetchData);
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding stock-detail-page">
      <LeavesHeader
        class="stock-detail-header"
        :title="t('user.stock_entry.new_entry', 'New Stock Entry')"
        show-back-button
        @click-back="triggerBack"
      />

      <div v-if="isLoading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent"></ion-spinner>
      </div>

      <div v-else class="stock-detail-content">
        <!-- Header Info -->
        <div class="info-section">
          <ion-row class="info-row">
            <ion-col size="6">
              <ion-text color="medium" class="label">{{ t("user.stock_entry.type", "Type") }}</ion-text>
              <ion-select
                v-model="stockEntry.stock_entry_type"
                fill="outline"
                class="warehouse-input"
                interface="alert"
                @ionChange="handleTypeChange"
              >
                <ion-select-option value="Material Issue">Material Issue</ion-select-option>
                <ion-select-option value="Material Transfer">Material Transfer</ion-select-option>
              </ion-select>
            </ion-col>
            <ion-col size="6">
              <ion-text color="medium" class="label">{{ t("user.stock_entry.date", "Date") }}</ion-text>
              <p class="value">{{ dayjs().format("DD MMM, YYYY") }}</p>
            </ion-col>
          </ion-row>

          <ion-row class="info-row">
            <ion-col :size="isMaterialTransfer ? 6 : 12">
              <ion-text color="medium" class="label">{{ t("user.stock_entry.source_warehouse", "Source") }}</ion-text>
              <div class="input-wrapper clickable-input-wrapper" @click="openWarehouseSelector('from_warehouse')">
                <ion-input
                  :value="stockEntry.from_warehouse || 'Select Warehouse'"
                  readonly
                  class="warehouse-input clickable-input"
                  fill="outline"
                ></ion-input>
              </div>
            </ion-col>
            <ion-col v-if="isMaterialTransfer" size="6">
              <ion-text color="medium" class="label">{{ t("user.stock_entry.target_warehouse", "Target") }}</ion-text>
              <div class="input-wrapper clickable-input-wrapper" @click="openWarehouseSelector('to_warehouse')">
                <ion-input
                  :value="stockEntry.to_warehouse || 'Select Warehouse'"
                  readonly
                  class="warehouse-input clickable-input"
                  fill="outline"
                  :disabled="!stockEntry.from_warehouse"
                ></ion-input>
              </div>
            </ion-col>
          </ion-row>

          <ion-row class="info-row">
            <ion-col size="12">
              <ion-text color="medium" class="label">{{ t("user.stock_entry.site_supervisor", "Site Supervisor") }}</ion-text>
              <p class="value">{{ stockEntry.custom_site_supervisor_name || '-' }}</p>
            </ion-col>
          </ion-row>
        </div>

        <!-- Items Table -->
        <div class="items-section">
          <div class="section-header">
            <h2 class="section-title">{{ t("user.stock_entry.items", "Items") }}</h2>
          </div>

          <div class="items-list">
            <div
              v-for="(item, index) in stockEntry.items"
              :key="index"
              class="item-row new-item"
              :class="{ 
                'stock-error': item.item_code && item.qty > getAvailableQty(item.item_code, stockEntry.from_warehouse)
              }"
            >
              <ion-row class="ion-align-items-center">
                <ion-col size="10" @click="!item.item_code ? openItemSelector(index) : null">
                  <template v-if="item.item_code">
                    <p class="item-name">{{ item.item_name }}</p>
                    <p class="item-code">{{ item.item_code }}</p>
                  </template>
                  <div v-else class="item-placeholder">
                    <ion-text color="primary">{{ t("user.stock_entry.select_item", "Select Item") }}</ion-text>
                  </div>
                </ion-col>
                <ion-col size="2" class="ion-text-right">
                  <ion-button fill="clear" color="danger" @click="removeItem(index)">
                    <IconClose />
                  </ion-button>
                </ion-col>
              </ion-row>

              <ion-row v-if="item.item_code" class="qty-row ion-align-items-center">
                <ion-col size="4">
                  <ion-text class="qty-label">{{ t("user.stock_entry.available", "Available") }}:</ion-text>
                  <span class="qty-value">{{ getAvailableQty(item.item_code, stockEntry.from_warehouse) }}</span>
                </ion-col>
                <ion-col size="5">
                  <div class="input-wrapper" @click="openUomSelector(index)">
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
                      class="qty-input"
                      fill="outline"
                    ></ion-input>
                  </div>
                </ion-col>
              </ion-row>
              <p v-if="item.item_code && item.qty > getAvailableQty(item.item_code, stockEntry.from_warehouse)" class="error-msg">
                {{ t("user.stock_entry.insufficient_stock", "Insufficient Stock") }}
              </p>
            </div>
          </div>

          <div class="add-item-wrapper ion-text-center">
            <ion-button fill="clear" color="primary" class="add-item-btn" @click="handleAddItem">
              + {{ t("utils.add", "Add") }}
            </ion-button>
          </div>
        </div>
      </div>

      <!-- Item Selection Modal -->
      <ion-modal :is-open="isItemModalOpen" @did-dismiss="isItemModalOpen = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ t("user.stock_entry.select_item", "Select Item") }}</ion-title>
            <ion-button slot="end" fill="clear" @click="isItemModalOpen = false">
              {{ t("utils.cancel", "Cancel") }}
            </ion-button>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-searchbar
            v-model="itemSearchQuery"
            :placeholder="t('user.stock_entry.search_item_placeholder', 'Search item...')"
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
              {{ t("utils.cancel", "Cancel") }}
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

      <!-- Warehouse Selection Modal -->
      <ion-modal :is-open="isWarehouseModalOpen" @did-dismiss="isWarehouseModalOpen = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ t("user.stock_entry.select_warehouse", "Select Warehouse") }}</ion-title>
            <ion-button slot="end" fill="clear" @click="isWarehouseModalOpen = false">
              {{ t("utils.cancel", "Cancel") }}
            </ion-button>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-searchbar
            v-model="warehouseSearchQuery"
            :placeholder="t('user.stock_entry.search_warehouse_placeholder', 'Search warehouse...')"
            debounce="300"
          />
          <ion-list>
            <ion-item
              v-for="wh in warehouseOptions"
              :key="wh.name"
              button
              @click="selectWarehouse(wh)"
            >
              <ion-label>
                <h2>{{ wh.name }}</h2>
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>

      <!-- Action Buttons -->
      <div class="footer-actions">
        <ion-row>
          <ion-col size="12">
            <ion-button expand="block" color="primary" @click="handleSave" :disabled="isSaving">
              <ion-spinner v-if="isSaving" name="crescent"></ion-spinner>
              <template v-else>Save Stock Entry</template>
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

  .clickable-input-wrapper {
    cursor: pointer;
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
    padding-bottom: 80px;
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
