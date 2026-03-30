import { httpService as http } from "./http.service";

type GetStockEntriesParams = {
	stock_entry_type?: string;
	from_date?: string;
	to_date?: string;
};

const getStockEntries = async (params: GetStockEntriesParams) =>
	await http.post(`v1.stock_entry.get_stock_entries`, { data: params });

export default {
	getStockEntries,
};
