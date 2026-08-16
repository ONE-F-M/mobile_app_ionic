import { httpService as http } from "./http.service";

type GetStockEntriesParams = {
	stock_entry_type?: string;
	from_date?: string;
	to_date?: string;
};

const getStockEntries = async (params: GetStockEntriesParams) =>
	await http.post(`v1.stock_entry.get_stock_entries`, { data: params });

const getStockEntryDetail = async (name: string) =>
	await http.get(`v1.stock_entry.get_stock_entry_detail`, { params: { name } });

const getWarehouseStockBalances = async (items: string[], warehouses: string[]) =>
	await http.post(`v1.stock_entry.get_warehouse_stock_balances`, {
		data: {
			items: JSON.stringify(items),
			warehouses: JSON.stringify(warehouses),
		},
	});

const getStockItems = async (warehouse?: string) => {
	const params: any = {};
	if (warehouse) params.warehouse = warehouse;
	return await http.get(`v1.stock_entry.get_stock_items`, { params });
};

const getWarehouses = async () =>
	await http.get(`v1.stock_entry.get_warehouses`);

const getUoms = async () =>
	await http.get(`v1.stock_entry.get_uoms`);

const updateStockEntry = async (name: string, data: any) =>
	await http.put(`/api/resource/Stock Entry/${name}`, { 
		data,
		headers: { "Content-Type": "application/json" }
	});

const createStockEntry = async (data: any) =>
	await http.post(`/api/resource/Stock Entry`, {
		data,
		headers: { "Content-Type": "application/json" }
	});

const submitStockEntry = async (docObj: any) =>
	await http.post(`/api/method/frappe.client.submit`, {
		data: { doc: JSON.stringify(docObj) },
	});

export default {
	getStockEntries,
	getStockEntryDetail,
	getWarehouseStockBalances,
	getStockItems,
	getWarehouses,
	getUoms,
	createStockEntry,
	updateStockEntry,
	submitStockEntry,
};
