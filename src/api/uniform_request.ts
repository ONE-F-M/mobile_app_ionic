import { httpService as http } from "./http.service";

export type UniformRequestPhoto = {
	/** File name as captured, so the backend can keep the extension. */
	attachment_name: string;
	/** The image bytes, base64 encoded. */
	attachment: string;
};

export type UniformRequestItem = {
	item_code: string;
	item_name?: string;
	size: string;
	attach_photo: UniformRequestPhoto;
};

/**
 * Raise a uniform replacement request for the logged-in employee.
 *
 * Only the item, its size and a photo of the damage are sent. Who the request is for,
 * their department, the quantity and the approver are all worked out on the server, so
 * the employee never types any of it.
 */
const createUniformRequest = async (
	items: UniformRequestItem[],
	schedule_date?: string,
) =>
	await http.post(`v2.uniform_request.create_uniform_request`, {
		data: {
			items: JSON.stringify(items),
			...(schedule_date ? { schedule_date } : {}),
		},
	});

/** Uniform items an employee can ask to have replaced. */
const getUniformItems = async () =>
	await http.get(`v2.uniform_request.get_uniform_items`);

export default {
	createUniformRequest,
	getUniformItems,
};
