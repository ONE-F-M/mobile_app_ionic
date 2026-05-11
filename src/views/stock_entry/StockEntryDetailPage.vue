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
  alertController,
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
const modalItemsQty = ref({}); // { item_code: quantity }

const itemOptions = computed(() => {
  let items = stockEntryStore.items;
  
  // Filter out items with 0 or missing available quantity
  items = items.filter(item => item.available_qty > 0);

  // Filter out items already in the stock entry list to avoid duplicates
  const existingItems = new Set(stockEntry.value?.items.map(i => i.item_code) || []);
  items = items.filter(item => !existingItems.has(item.item_code));

  if (!itemSearchQuery.value || itemSearchQuery.value.trim() === "") {
    return items.slice(0, 30);
  }
  const query = itemSearchQuery.value.toLowerCase();
  return items.filter(item => 
    item.item_code.toLowerCase().includes(query) || 
    item.item_name.toLowerCase().includes(query)
  ).slice(0, 30); // Limit results for performance
});

const selectedCount = computed(() => {
  return Object.values(modalItemsQty.value).filter(qty => qty && parseFloat(qty) > 0).length;
});

const isUomModalOpen = ref(false);
const uomSearchQuery = ref("");
const activeUomIndex = ref(-1);

const isWarehouseModalOpen = ref(false);
const warehouseSearchQuery = ref("");
const activeWarehouseField = ref(""); // 'from_warehouse' or 'to_warehouse'

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
  if (stockEntry.value) {
    if (activeWarehouseField.value === "from_warehouse") {
      list = list.filter(w => w.name !== stockEntry.value.to_warehouse);
    } else if (activeWarehouseField.value === "to_warehouse") {
      list = list.filter(w => w.name !== stockEntry.value.from_warehouse);
    }
  }

  if (!warehouseSearchQuery.value || warehouseSearchQuery.value.trim() === "") {
    return list.slice(0, 20);
  }
  const query = warehouseSearchQuery.value.toLowerCase();
  return list.filter(w => 
    w.name.toLowerCase().includes(query)
  ).slice(0, 20);
});

const isDraft = computed(() => stockEntry.value?.docstatus === 0);
const isMaterialTransfer = computed(() => stockEntry.value?.stock_entry_type === "Material Transfer");

const fetchData = async () => {
  isLoading.value = true;
  try {
    stockEntryStore.fetchWarehouses();
    const { data: detailData } = await stockEntryApi.getStockEntryDetail(stockEntryId);
    stockEntry.value = detailData.data;

    if (stockEntry.value.from_warehouse) {
      stockEntryStore.fetchStockItems(stockEntry.value.from_warehouse);
    } else {
      stockEntryStore.fetchStockItems();
    }
    stockEntryStore.fetchUoms();

    // Prefetch stock balances
    const itemCodes = stockEntry.value.items.filter(i => i.item_code).map((i) => i.item_code);
    const warehouses = [stockEntry.value.from_warehouse].filter(w => w);
    if (stockEntry.value.to_warehouse) {
      warehouses.push(stockEntry.value.to_warehouse);
    }
    
    if (itemCodes.length > 0 && warehouses.length > 0) {
      const { data: balanceData } = await stockEntryApi.getWarehouseStockBalances(itemCodes, warehouses);
      stockBalances.value = balanceData.data || {};
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
      // eslint-disable-next-line no-unused-vars
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

  const alert = await alertController.create({
    header: t("utils.confirm_submit", "Confirm Submission"),
    message: t("user.stock_entry.confirm_submit_msg", "Are you sure you want to submit?"),
    buttons: [
      {
        text: t("utils.cancel", "Cancel"),
        role: "cancel",
      },
      {
        text: t("utils.submit", "Submit"),
        handler: async () => {
          await executeSubmit();
        },
      },
    ],
  });

  await alert.present();
};

const executeSubmit = async () => {
  isSubmitting.value = true;
  try {
    const payload = { ...stockEntry.value };
    payload.items = payload.items.map(item => {
      // eslint-disable-next-line no-unused-vars
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
  modalItemsQty.value = {};
  isItemModalOpen.value = true;
  itemSearchQuery.value = "";
};

const addSelectedItems = () => {
  const selectedItems = Object.entries(modalItemsQty.value)
    // eslint-disable-next-line no-unused-vars
    .filter(([_, qty]) => qty && parseFloat(qty) > 0)
    .map(([itemCode, qty]) => {
      const item = stockEntryStore.items.find(i => i.item_code === itemCode);
      return {
        item_code: item.item_code,
        item_name: item.item_name,
        qty: parseFloat(qty),
        uom: item.stock_uom,
        stock_uom: item.stock_uom,
        is_new: true,
      };
    });

  if (selectedItems.length === 0) {
    showToast(t("user.stock_entry.select_at_least_one", "Please enter quantity for at least one item"), "warning");
    return;
  }

  // Update local stock balances for the added items
  const fromWh = stockEntry.value.from_warehouse;
  if (fromWh) {
    if (!stockBalances.value[fromWh]) stockBalances.value[fromWh] = {};
    selectedItems.forEach(si => {
      const storeItem = stockEntryStore.items.find(i => i.item_code === si.item_code);
      if (storeItem && storeItem.available_qty !== undefined) {
        stockBalances.value[fromWh][si.item_code] = storeItem.available_qty;
      }
    });
  }

  // If we opened this for a specific blank row, replace it. Otherwise append.
  if (activeItemIndex.value !== -1 && !stockEntry.value.items[activeItemIndex.value].item_code) {
    stockEntry.value.items.splice(activeItemIndex.value, 1, ...selectedItems);
  } else {
    stockEntry.value.items.push(...selectedItems);
  }

  isItemModalOpen.value = false;
  modalItemsQty.value = {};
};

// // const selectItem = async (item) => {
//   // Keeping this for compatibility or single selection if needed
//   modalItemsQty.value[item.item_code] = 1;
// };
// };

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

const openWarehouseSelector = (fieldName) => {
  if (!isDraft.value) return;
  if (fieldName === "to_warehouse" && !stockEntry.value.from_warehouse) {
    showToast(t("user.stock_entry.select_source_first", "Please select Source Warehouse first"), "warning");
    return;
  }
  activeWarehouseField.value = fieldName;
  isWarehouseModalOpen.value = true;
  warehouseSearchQuery.value = "";
};

const selectWarehouse = (warehouse) => {
  if (stockEntry.value) {
    stockEntry.value[activeWarehouseField.value] = warehouse.name;
    isWarehouseModalOpen.value = false;
  }
};

watch(() => stockEntry.value?.from_warehouse, async (newVal, oldVal) => {
  if (!newVal || newVal === oldVal) return;

  // Always refresh the modal items list for the new warehouse
  stockEntryStore.fetchStockItems(newVal);

  if (!stockEntry.value?.items?.length) return;
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
    fetchStockBalances();
  } catch (error) {
    console.error("Failed to refresh items for new warehouse:", error);
  }
});

onMounted(() => {
  fetchData();
});
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
              <template v-if="isDraft">
                <div class="input-wrapper clickable-input-wrapper" @click="openWarehouseSelector('from_warehouse')">
                  <ion-input
                    :value="stockEntry.from_warehouse || 'Select Warehouse'"
                    readonly
                    class="warehouse-input clickable-input"
                    fill="outline"
                  ></ion-input>
                </div>
              </template>
              <p v-else class="value">{{ stockEntry.from_warehouse }}</p>
            </ion-col>
            <ion-col v-if="isMaterialTransfer" size="6">
              <ion-text color="medium" class="label">{{ t("user.stock_entry.target_warehouse") }}</ion-text>
              <template v-if="isDraft">
                <div class="input-wrapper clickable-input-wrapper" @click="openWarehouseSelector('to_warehouse')">
                  <ion-input
                    :value="stockEntry.to_warehouse || 'Select Warehouse'"
                    readonly
                    class="warehouse-input clickable-input"
                    fill="outline"
                    :disabled="!stockEntry.from_warehouse"
                  ></ion-input>
                </div>
              </template>
              <p v-else class="value">{{ stockEntry.to_warehouse }}</p>
            </ion-col>
          </ion-row>

          <ion-row class="info-row">
            <ion-col size="12">
              <ion-text color="medium" class="label">{{ t("user.stock_entry.site_supervisor") }}</ion-text>
              <p class="value">{{ stockEntry.custom_site_supervisor_name || '-' }}</p>
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
                  <ion-button v-if="isDraft" fill="clear" color="danger" @click="removeItem(index)">
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

      <ion-modal :is-open="isItemModalOpen" @did-dismiss="isItemModalOpen = false" class="multi-item-modal">
        <ion-header>
          <ion-toolbar>
            <ion-title>
              {{ t("user.stock_entry.select_items", "Select Items") }}
              <ion-badge v-if="selectedCount > 0" color="primary" class="selected-badge">
                {{ selectedCount }}
              </ion-badge>
            </ion-title>
            <ion-buttons slot="start">
              <ion-button @click="isItemModalOpen = false">{{ t("utils.cancel", "Cancel") }}</ion-button>
            </ion-buttons>
            <ion-buttons slot="end">
              <ion-button strong @click="addSelectedItems" color="primary">{{ t("utils.add", "Add") }}</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-searchbar
            v-model="itemSearchQuery"
            :placeholder="t('user.stock_entry.search_item_placeholder', 'Search item...')"
            debounce="300"
          />
          <div class="modal-items-list">
            <div v-for="item in itemOptions" :key="item.item_code" class="modal-item-row">
              <ion-row class="ion-align-items-center">
                <ion-col size="7">
                  <p class="modal-item-name">{{ item.item_name }}</p>
                  <p class="modal-item-code">{{ item.item_code }}</p>
                  <p class="modal-item-available">
                    {{ t("user.stock_entry.available", "Available") }}: 
                    <span class="stock-qty">{{ item.available_qty || 0 }}</span>
                  </p>
                </ion-col>
                <ion-col size="5">
                  <div class="modal-qty-input-wrapper">
                    <ion-input
                      type="number"
                      v-model="modalItemsQty[item.item_code]"
                      placeholder="0"
                      class="modal-qty-input"
                      fill="outline"
                      min="0"
                      :max="item.available_qty"
                    ></ion-input>
                  </div>
                </ion-col>
              </ion-row>
            </div>
            <div v-if="itemOptions.length === 0" class="ion-padding ion-text-center">
              <ion-text color="medium">{{ t("user.stock_entry.no_items_found", "No available items found") }}</ion-text>
            </div>
          </div>
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

      <!-- Warehouse Selection Modal -->
      <ion-modal :is-open="isWarehouseModalOpen" @did-dismiss="isWarehouseModalOpen = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ t("user.stock_entry.select_warehouse", "Select Warehouse") }}</ion-title>
            <ion-button slot="end" fill="clear" @click="isWarehouseModalOpen = false">
              {{ t("utils.cancel") }}
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
    padding-bottom: 80px; // Ensure space above fixed footer
  }
}

.modal-items-list {
  padding: 8px;

  .modal-item-row {
    background: #232a2e;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 8px;
    border: 1px solid #364955;

    .modal-item-name {
      font-weight: 600;
      font-size: 0.95rem;
      margin: 0;
      color: #e0e3e3;
    }

    .modal-item-code {
      font-size: 0.8rem;
      color: #8b9298;
      margin: 2px 0;
    }

    .modal-item-available {
      font-size: 0.75rem;
      color: #8b9298;
      margin: 4px 0 0;
      
      .stock-qty {
        color: var(--ion-color-primary);
        font-weight: 600;
      }
    }

    .modal-qty-input-wrapper {
      .modal-qty-input {
        --padding-start: 8px;
        --padding-end: 8px;
        --background: #191c1d;
        --color: #e0e3e3;
        font-size: 1rem;
        text-align: right;
        height: 38px;
      }
    }
  }
}

.multi-item-modal {
  --height: 90%;
  --border-radius: 16px 16px 0 0;

  .selected-badge {
    margin-left: 8px;
    font-size: 0.8rem;
    vertical-align: middle;
  }
}
</style>
