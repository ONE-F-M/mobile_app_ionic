import { defineStore } from "pinia";
import stockEntryApi from "@/api/stock_entry";
import useDateHelper from "@/composable/useDateHelper";

export const useStockEntryStore = defineStore("stockEntry", {
	state: () => {
		const { dayjs } = useDateHelper();
		return {
			stockEntries: [],
			isLoading: false,
			lastFetch: null,
			filters: {
				stock_entry_type: ["Material Transfer", "Material Issue"],
				from_date: dayjs().subtract(1, "year").format("YYYY-MM-DD"),
				to_date: dayjs().format("YYYY-MM-DD"),
			},
			items: [],
			isItemsLoading: false,
			warehouses: [],
			isWarehousesLoading: false,
			uoms: [],
			isUomsLoading: false,
		};
	},
	actions: {
		async fetchStockEntries() {
			this.isLoading = true;
			const { dayjs } = useDateHelper();
			try {
				let typeFilter = this.filters.stock_entry_type;
				// If it's an array with all values or empty, we might want to send it as is or handle it
				// The backend now handles both string and list
				const { data } = await stockEntryApi.getStockEntries({
					stock_entry_type: typeFilter && typeFilter.length > 0 ? typeFilter : "",
					from_date: dayjs(this.filters.from_date).format("YYYY-MM-DD"),
					to_date: dayjs(this.filters.to_date).format("YYYY-MM-DD"),
				});
				this.stockEntries = data.message || [];
				this.lastFetch = Date.now();
			} catch (error) {
				console.error("Failed to fetch stock entries:", error);
				throw error;
			} finally {
				this.isLoading = false;
			}
		},
		setFilters(newFilters) {
			this.filters = { ...this.filters, ...newFilters };
		},
		resetFilters() {
			const { dayjs } = useDateHelper();
			this.filters = {
				stock_entry_type: ["Material Transfer", "Material Issue"],
				from_date: dayjs().subtract(1, "year").format("YYYY-MM-DD"),
				to_date: dayjs().format("YYYY-MM-DD"),
			};
		},
		async fetchStockItems() {
			if (this.items.length > 0) return;
			this.isItemsLoading = true;
			try {
				const { data } = await stockEntryApi.getStockItems();
				this.items = data.message || [];
			} catch (error) {
				console.error("Failed to fetch stock items:", error);
			} finally {
				this.isItemsLoading = false;
			}
		},
		clearItems() {
			this.items = [];
		},
		async fetchWarehouses() {
			if (this.warehouses.length > 0) return;
			this.isWarehousesLoading = true;
			try {
				const { data } = await stockEntryApi.getWarehouses();
				this.warehouses = data.message || [];
			} catch (error) {
				console.error("Failed to fetch warehouses:", error);
			} finally {
				this.isWarehousesLoading = false;
			}
		},
		async fetchUoms() {
			if (this.uoms.length > 0) return;
			this.isUomsLoading = true;
			try {
				const { data } = await stockEntryApi.getUoms();
				this.uoms = data.message || [];
			} catch (error) {
				console.error("Failed to fetch uoms:", error);
			} finally {
				this.isUomsLoading = false;
			}
		},
	},
	persist: true,
});
