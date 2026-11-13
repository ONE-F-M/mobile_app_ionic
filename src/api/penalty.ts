import { httpService as http } from "./http.service";

const BASE = "v2.penalty_issuance";

/** Active employees matching name or employee ID; the server needs at least 3 characters. */
const searchEmployees = async (txt: string) =>
	await http.get(`${BASE}.search_employees`, { params: { txt } });

const getPenaltyTypes = async () => await http.get(`${BASE}.get_penalty_types`);

/** Operations Shifts with their site, project and site_location. */
const getShifts = async (txt = "") =>
	await http.get(`${BASE}.get_shifts`, { params: { txt } });

/** The employee's rostered shift at occurrence_time ("YYYY-MM-DD HH:mm:ss"). */
const getCurrentAssignment = async (employee: string, occurrence_time: string) =>
	await http.get(`${BASE}.get_current_assignment`, {
		params: { employee, occurrence_time },
	});

/** Creates and submits the Penalty Issuance; payload comes from buildPenaltyPayload. */
const submitPenaltyIssuance = async (payload: object) =>
	await http.post(`${BASE}.submit_penalty_issuance`, {
		data: { payload: JSON.stringify(payload) },
	});

export default {
	searchEmployees,
	getPenaltyTypes,
	getShifts,
	getCurrentAssignment,
	submitPenaltyIssuance,
};
