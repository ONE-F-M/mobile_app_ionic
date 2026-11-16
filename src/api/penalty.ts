import { httpService as http } from "./http.service";

const BASE = "v2.penalty_issuance";

/** Active employees matching name or employee ID; the server needs at least 3 characters. */
const searchEmployees = async (txt: string) =>
	await http.get(`${BASE}.search_employees`, { params: { txt } });

const getPenaltyTypes = async () => await http.get(`${BASE}.get_penalty_types`);

/** Creates and submits the Penalty Issuance; payload comes from buildPenaltyPayload. */
const submitPenaltyIssuance = async (payload: object) =>
	await http.post(`${BASE}.submit_penalty_issuance`, {
		data: { payload: JSON.stringify(payload) },
	});

export default {
	searchEmployees,
	getPenaltyTypes,
	submitPenaltyIssuance,
};
